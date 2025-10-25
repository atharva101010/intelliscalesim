from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter(prefix="/api/scenario", tags=["scenario-billing"])

class ScenarioRequest(BaseModel):
    provider: str  # AWS, GCP, Azure
    cpu_cores: int  # Number of CPU cores
    memory_gb: int  # Memory in GB
    storage_gb: int  # Storage in GB
    duration_hours: float  # Duration in hours

@router.post("/calculate")
async def calculate_scenario_cost(scenario: ScenarioRequest):
    """Calculate cost based on user-defined scenario"""
    try:
        # Get pricing from database
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT cpu_per_core, memory_per_gb, storage_per_gb 
            FROM prices 
            WHERE provider = ?
        ''', (scenario.provider,))
        
        pricing = cursor.fetchone()
        conn.close()
        
        if not pricing:
            raise HTTPException(status_code=404, detail=f"Pricing not found for {scenario.provider}")
        
        cpu_per_core, memory_per_gb, storage_per_gb = pricing
        
        # Calculate costs
        cpu_cost = scenario.cpu_cores * scenario.duration_hours * cpu_per_core
        memory_cost = scenario.memory_gb * scenario.duration_hours * memory_per_gb
        # Storage is monthly, convert to hourly (assuming 30 days = 720 hours)
        storage_cost = scenario.storage_gb * (storage_per_gb / 30)
        
        total_cost = cpu_cost + memory_cost + storage_cost
        
        return {
            "provider": scenario.provider,
            "cpu_cost": round(cpu_cost, 4),
            "memory_cost": round(memory_cost, 4),
            "storage_cost": round(storage_cost, 4),
            "total_cost": round(total_cost, 4),
            "breakdown": {
                "cpu": f"{scenario.cpu_cores} cores × {scenario.duration_hours} hours × ${cpu_per_core:.4f}/hour",
                "memory": f"{scenario.memory_gb} GB × {scenario.duration_hours} hours × ${memory_per_gb:.4f}/hour",
                "storage": f"{scenario.storage_gb} GB × ${storage_per_gb:.2f}/month"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

