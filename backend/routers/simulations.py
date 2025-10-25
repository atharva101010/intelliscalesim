from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import docker
from pydantic import BaseModel

from models.database import get_db
from models.simulation import Simulation, User

router = APIRouter(prefix="/simulations", tags=["simulations"])

# Lazy Docker client initialization
def get_docker_client():
    """Get Docker client - lazy initialization"""
    try:
        return docker.from_env()
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Docker connection failed. Make sure Docker is running: {str(e)}"
        )


# ============== Pydantic Models ==============

class SimulationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: str
    cpu_limit: float = 1.0
    memory_limit: str = "512m"
    replicas: int = 1
    assigned_students: List[int] = []
    metadata: dict = {}


class SimulationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    image: str
    cpu_limit: float
    memory_limit: str
    replicas: int
    status: str
    container_ids: List[str]
    assigned_students: List[int]
    teacher_id: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    metadata_json: dict

    class Config:
        from_attributes = True


# ============== API Endpoints ==============

@router.post("/", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def create_simulation(
    simulation: SimulationCreate,
    teacher_id: int = 1,  # TODO: Get from auth token
    db: Session = Depends(get_db)
):
    """Create a new simulation"""
    
    # Create simulation record
    db_simulation = Simulation(
        name=simulation.name,
        description=simulation.description,
        image=simulation.image,
        cpu_limit=simulation.cpu_limit,
        memory_limit=simulation.memory_limit,
        replicas=simulation.replicas,
        assigned_students=simulation.assigned_students,
        teacher_id=teacher_id,
        status="pending",
        metadata_json=simulation.metadata
    )
    
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    
    return db_simulation


@router.get("/", response_model=List[SimulationResponse])
async def get_simulations(
    teacher_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all simulations (with optional filters)"""
    
    query = db.query(Simulation)
    
    if teacher_id:
        query = query.filter(Simulation.teacher_id == teacher_id)
    
    if status:
        query = query.filter(Simulation.status == status)
    
    simulations = query.all()
    return simulations


@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Get a specific simulation"""
    
    simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    return simulation


@router.post("/{simulation_id}/start")
async def start_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Start a simulation (deploy containers)"""
    
    simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    if simulation.status == "running":
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    docker_client = get_docker_client()
    
    try:
        container_ids = []
        
        # Deploy containers based on replicas
        for i in range(simulation.replicas):
            container = docker_client.containers.run(
                image=simulation.image,
                name=f"{simulation.name}-{simulation.id}-{i}",
                detach=True,
                cpu_quota=int(simulation.cpu_limit * 100000),
                mem_limit=simulation.memory_limit,
                labels={
                    "simulation_id": str(simulation.id),
                    "simulation_name": simulation.name,
                    "replica_index": str(i)
                }
            )
            container_ids.append(container.id)
        
        # Update simulation status
        simulation.status = "running"
        simulation.container_ids = container_ids
        simulation.started_at = datetime.utcnow()
        
        db.commit()
        db.refresh(simulation)
        
        return {
            "message": "Simulation started successfully",
            "simulation_id": simulation.id,
            "containers": container_ids
        }
    
    except Exception as e:
        simulation.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start simulation: {str(e)}")


@router.post("/{simulation_id}/stop")
async def stop_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Stop a running simulation"""
    
    simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    if simulation.status != "running":
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    docker_client = get_docker_client()
    
    try:
        # Stop all containers
        for container_id in simulation.container_ids:
            try:
                container = docker_client.containers.get(container_id)
                container.stop()
                container.remove()
            except:
                pass  # Container might already be stopped
        
        # Update simulation status
        simulation.status = "stopped"
        simulation.completed_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Simulation stopped successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop simulation: {str(e)}")


@router.delete("/{simulation_id}")
async def delete_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Delete a simulation"""
    
    simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    docker_client = get_docker_client()
    
    # Stop containers if running
    if simulation.status == "running":
        for container_id in simulation.container_ids:
            try:
                container = docker_client.containers.get(container_id)
                container.stop()
                container.remove()
            except:
                pass
    
    db.delete(simulation)
    db.commit()
    
    return {"message": "Simulation deleted successfully"}


@router.get("/{simulation_id}/stats")
async def get_simulation_stats(simulation_id: int, db: Session = Depends(get_db)):
    """Get real-time stats for a simulation"""
    
    simulation = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    if simulation.status != "running":
        return {"message": "Simulation not running", "stats": []}
    
    docker_client = get_docker_client()
    stats = []
    
    for container_id in simulation.container_ids:
        try:
            container = docker_client.containers.get(container_id)
            container_stats = container.stats(stream=False)
            
            # Calculate CPU and memory usage
            cpu_delta = container_stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                       container_stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = container_stats["cpu_stats"]["system_cpu_usage"] - \
                          container_stats["precpu_stats"]["system_cpu_usage"]
            cpu_percent = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0
            
            memory_usage = container_stats["memory_stats"]["usage"] / (1024 * 1024)  # MB
            memory_limit = container_stats["memory_stats"]["limit"] / (1024 * 1024)  # MB
            
            stats.append({
                "container_id": container_id[:12],
                "status": container.status,
                "cpu_percent": round(cpu_percent, 2),
                "memory_usage_mb": round(memory_usage, 2),
                "memory_limit_mb": round(memory_limit, 2),
                "memory_percent": round((memory_usage / memory_limit) * 100, 2)
            })
        except Exception as e:
            stats.append({
                "container_id": container_id[:12],
                "error": str(e)
            })
    
    return {"simulation_id": simulation_id, "stats": stats}
