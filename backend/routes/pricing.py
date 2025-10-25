from fastapi import APIRouter, HTTPException
import sqlite3

router = APIRouter(prefix="/api/pricing", tags=["pricing"])

@router.get("/{provider}")
async def get_provider_pricing(provider: str):
    """Get pricing for a specific provider"""
    try:
        conn = sqlite3.connect('deployments.db')
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT cpu_per_core, memory_per_gb, storage_per_gb FROM prices WHERE provider = ?",
            (provider,)
        )
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Pricing not found for provider: {provider}")
        
        return {
            "provider": provider,
            "cpuPerCore": result[0],
            "memoryPerGB": result[1],
            "storagePerGB": result[2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_pricing():
    """Get pricing for all providers"""
    try:
        conn = sqlite3.connect('deployments.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT provider, cpu_per_core, memory_per_gb, storage_per_gb FROM prices")
        results = cursor.fetchall()
        conn.close()
        
        return [
            {
                "provider": row[0],
                "cpuPerCore": row[1],
                "memoryPerGB": row[2],
                "storagePerGB": row[3]
            }
            for row in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
