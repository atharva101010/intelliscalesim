from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import docker
from datetime import datetime
from database import get_db
from models.cloud_pricing import CloudPricing

router = APIRouter(prefix="/api/metrics", tags=["realtime-billing"])

# Time interval mappings (in hours)
TIME_INTERVALS = {
    "Last 1 Hour": 1,
    "Last 6 Hours": 6,
    "Last 12 Hours": 12,
    "Last 24 Hours": 24
}

@router.get("/{container_name}")
async def get_realtime_billing(
    container_name: str,
    provider: str = Query(..., description="Cloud provider (AWS, GCP, AZURE)"),
    interval: str = Query("Last 1 Hour", description="Time interval"),
    db: Session = Depends(get_db)
):
    """Get real-time billing metrics for a container"""
    try:
        # Get Docker client
        client = docker.from_env()
        
        # Get container
        try:
            container = client.containers.get(container_name)
        except docker.errors.NotFound:
            raise HTTPException(status_code=404, detail=f"Container '{container_name}' not found")
        
        # Check if running
        if container.status != 'running':
            raise HTTPException(status_code=400, detail=f"Container '{container_name}' is not running")
        
        # Get container stats
        stats = container.stats(stream=False)
        
        # Calculate CPU usage (in cores)
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
        cpu_count = stats['cpu_stats'].get('online_cpus', len(stats['cpu_stats']['cpu_usage'].get('percpu_usage', [1])))
        cpu_percent = (cpu_delta / system_delta) * cpu_count if system_delta > 0 else 0
        cpu_cores = cpu_percent / 100 * cpu_count
        
        # Calculate memory usage (in GB)
        memory_gb = stats['memory_stats']['usage'] / (1024 ** 3)
        
        # Storage (simulated)
        storage_gb = 3.0
        
        # Get duration from interval
        duration_hours = TIME_INTERVALS.get(interval, 1)
        
        # Get pricing for provider
        pricing = db.query(CloudPricing).filter(
            CloudPricing.provider == provider,
            CloudPricing.is_active == True
        ).first()
        
        if not pricing:
            raise HTTPException(status_code=404, detail=f"Pricing not found for provider: {provider}")
        
        # Calculate costs
        cpu_cost = cpu_cores * pricing.cpu_per_vcpu_hour * duration_hours
        memory_cost = memory_gb * pricing.memory_per_gb_hour * duration_hours
        storage_cost = storage_gb * pricing.storage_per_gb_month * (duration_hours / 730)  # 730 hours per month
        total_cost = cpu_cost + memory_cost + storage_cost
        
        return {
            "container": container_name,
            "provider": provider,
            "interval": interval,
            "cpu_usage": round(cpu_cores, 4),
            "memory_usage": round(memory_gb, 4),
            "storage_usage": storage_gb,
            "cpu_cost": round(cpu_cost, 4),
            "memory_cost": round(memory_cost, 4),
            "storage_cost": round(storage_cost, 4),
            "total_cost": round(total_cost, 4)
        }
        
    except docker.errors.DockerException as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
