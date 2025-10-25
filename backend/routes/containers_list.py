from fastapi import APIRouter, HTTPException
import docker

router = APIRouter(prefix="/api", tags=["containers"])

@router.get("/containers")
async def get_containers():
    """Get list of running Docker containers"""
    try:
        client = docker.from_env()
        containers = client.containers.list(all=False)  # Only running containers
        
        container_list = []
        for container in containers:
            # Filter out system containers (prometheus, grafana, cadvisor, node-exporter)
            if container.name not in ['prometheus', 'grafana', 'cadvisor', 'node-exporter']:
                container_list.append({
                    'name': container.name,
                    'id': container.short_id,
                    'status': container.status,
                    'image': container.image.tags[0] if container.image.tags else 'unknown'
                })
        
        return {'success': True, 'containers': container_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
