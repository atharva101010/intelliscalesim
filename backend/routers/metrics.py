from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from services.docker_metrics_cli import docker_metrics_service
import json
import asyncio
from typing import Optional

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/status")
async def get_docker_status():
    """Check Docker daemon status"""
    status = docker_metrics_service.check_docker_status()
    return {"success": True, "data": status}

@router.get("/containers")
async def get_containers(user_id: Optional[str] = Query(None)):
    """Get all student containers with metrics"""
    metrics = docker_metrics_service.get_aggregated_metrics(user_id)
    return {"success": True, "data": metrics}

@router.get("/container/{container_id}")
async def get_container_metrics(container_id: str):
    """Get metrics for a specific container"""
    metrics = docker_metrics_service.get_container_metrics(container_id)
    
    if metrics.get('error') and not metrics.get('running'):
        return {"success": False, "message": metrics['error']}, 404
    
    return {"success": True, "data": metrics}

@router.get("/container/{container_id}/logs")
async def get_container_logs(container_id: str, tail: int = Query(100)):
    """Get logs for a specific container"""
    logs = docker_metrics_service.get_container_logs(container_id, tail)
    return {
        "success": True,
        "data": {
            "logs": logs,
            "containerId": container_id
        }
    }

@router.get("/live")
async def live_metrics(user_id: Optional[str] = Query(None)):
    """Server-Sent Events for live metrics streaming"""
    async def event_generator():
        while True:
            try:
                metrics = docker_metrics_service.get_aggregated_metrics(user_id)
                yield f"data: {json.dumps(metrics)}\n\n"
                await asyncio.sleep(3)
            except Exception as e:
                print(f"Error streaming metrics: {e}")
                break
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
