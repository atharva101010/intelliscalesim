from fastapi import APIRouter
from pydantic import BaseModel
from services.autoscaler_service import autoscaler_service

router = APIRouter(prefix="/api/autoscaling", tags=["autoscaling"])

class AutoScalingConfig(BaseModel):
    cpuScaleUp: int
    cpuScaleDown: int
    memScaleUp: int
    memScaleDown: int
    minReplicas: int
    maxReplicas: int
    checkInterval: int

@router.post("/start")
async def start_autoscaler():
    """Start the auto-scaler"""
    result = autoscaler_service.start()
    return {"success": result['success'], "message": result['message'], "data": result.get('config')}

@router.post("/stop")
async def stop_autoscaler():
    """Stop the auto-scaler"""
    result = autoscaler_service.stop()
    return {"success": result['success'], "message": result['message']}

@router.post("/config")
async def update_config(config: AutoScalingConfig):
    """Update auto-scaling configuration"""
    autoscaler_service.update_config(config.dict())
    return {"success": True, "message": "Configuration updated", "data": config.dict()}

@router.get("/status")
async def get_status():
    """Get auto-scaler status and history"""
    status = autoscaler_service.get_status()
    return {"success": True, "data": status}

@router.get("/history")
async def get_history():
    """Get scaling history"""
    history = autoscaler_service.scaling_history
    return {"success": True, "data": history}
