from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import subprocess
import socket
import contextlib
import time
import os
import shutil
from typing import Optional, List
from prometheus_client import Counter, Gauge, generate_latest, CONTENT_TYPE_LATEST
from datetime import datetime

# Import autoscaler
from .autoscaler import autoscaler, ReplicaGroup, ScalingPolicy

app = FastAPI(
    title="IntelliScaleSim API",
    description="Lightweight self-hosted platform for simulating cloud environments with autoscaling",
    version="0.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# Port range for dynamic allocation
SAFE_LOW_PORT = 20000
SAFE_HIGH_PORT = 30000

# Directory for temporary git clones
TEMP_DIR = "/tmp/intelliscalesim_builds"
os.makedirs(TEMP_DIR, exist_ok=True)

# Deployment history (in-memory for now)
deployment_history = []

# Prometheus metrics
deployments_total = Counter('intelliscalesim_deployments_total', 'Total number of deployments')
deployments_failed = Counter('intelliscalesim_deployments_failed', 'Total number of failed deployments')
containers_running = Gauge('intelliscalesim_containers_running', 'Number of running containers')
github_deployments_total = Counter('intelliscalesim_github_deployments_total', 'Total GitHub deployments')
replica_groups_total = Gauge('intelliscalesim_replica_groups_total', 'Total replica groups')
autoscaling_events_total = Counter('intelliscalesim_autoscaling_events_total', 'Total autoscaling events', ['action'])


def run_docker_command(args, capture_output=True, text=True, check=True):
    """Run a docker command using subprocess."""
    try:
        result = subprocess.run(
            ['docker'] + args,
            capture_output=capture_output,
            text=text,
            check=check
        )
        return result.stdout.strip() if capture_output else None
    except subprocess.CalledProcessError as e:
        raise Exception(f"Docker command failed: {e.stderr if e.stderr else str(e)}")


def check_docker_connection():
    """Check if Docker is accessible."""
    try:
        run_docker_command(['ps'])
        return True
    except:
        return False


def find_free_port() -> int:
    """Find a free port in the safe range by attempting to bind to it."""
    for port in range(SAFE_LOW_PORT, SAFE_HIGH_PORT):
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue
    raise RuntimeError("No free port available in the safe range")


def update_container_metrics():
    """Update Prometheus metrics with current container count."""
    try:
        result = run_docker_command(['ps', '-q', '--filter', 'label=managed_by=intelliscalesim'])
        container_count = len([c for c in result.split('\n') if c.strip()])
        containers_running.set(container_count)
        
        # Update replica groups count
        replica_groups_total.set(len(autoscaler.replica_groups))
    except:
        pass


def add_deployment_history(deployment_type, details):
    """Add deployment to history."""
    deployment_history.append({
        "timestamp": datetime.now().isoformat(),
        "type": deployment_type,
        **details
    })
    # Keep only last 100 deployments
    if len(deployment_history) > 100:
        deployment_history.pop(0)


class DeployImageRequest(BaseModel):
    image_name: str = Field(..., description="Docker image name (e.g., nginx:latest)")
    container_port: int = Field(80, ge=1, le=65535, description="Internal container port to expose")
    name: Optional[str] = Field(None, description="Optional custom name for the container")
    mem_limit: Optional[str] = Field("512m", description="Memory limit (e.g., 512m, 1g)")
    cpu_quota: Optional[float] = Field(0.5, description="CPU quota (0.5 = 50% of one core)")
    enable_autoscaling: Optional[bool] = Field(False, description="Enable autoscaling for this deployment")
    min_replicas: Optional[int] = Field(1, ge=1, le=10, description="Minimum replicas (if autoscaling enabled)")
    max_replicas: Optional[int] = Field(5, ge=1, le=20, description="Maximum replicas (if autoscaling enabled)")


class DeployGitRequest(BaseModel):
    repo_url: str = Field(..., description="Public GitHub repository URL")
    branch: Optional[str] = Field("main", description="Branch to clone")
    dockerfile_path: Optional[str] = Field("Dockerfile", description="Path to Dockerfile in repo")
    container_port: int = Field(80, ge=1, le=65535, description="Internal container port to expose")
    name: Optional[str] = Field(None, description="Optional custom name for the container")
    mem_limit: Optional[str] = Field("512m", description="Memory limit")
    cpu_quota: Optional[float] = Field(0.5, description="CPU quota")
    enable_autoscaling: Optional[bool] = Field(False, description="Enable autoscaling for this deployment")
    min_replicas: Optional[int] = Field(1, ge=1, le=10, description="Minimum replicas (if autoscaling enabled)")
    max_replicas: Optional[int] = Field(5, ge=1, le=20, description="Maximum replicas (if autoscaling enabled)")


class DeployResponse(BaseModel):
    message: str
    container_id: str
    container_name: str
    host_port: int
    url: str
    deployment_type: str
    autoscaling_enabled: bool = False
    replica_group: Optional[str] = None


class ContainerActionResponse(BaseModel):
    message: str
    container_id: str
    action: str


@app.on_event("startup")
async def startup_event():
    """Start the autoscaler on application startup"""
    autoscaler.start()


@app.on_event("shutdown")
async def shutdown_event():
    """Stop the autoscaler on application shutdown"""
    autoscaler.stop()


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "service": "IntelliScaleSim",
        "version": "0.3.0",
        "status": "running",
        "phase": "Phase 3 - Autoscaling & Intelligence",
        "features": ["Container Deployment", "GitHub CI/CD", "Autoscaling", "Monitoring"],
        "endpoints": {
            "health": "/health",
            "deploy": "/deploy",
            "deploy_git": "/deploy_git",
            "deploy_docker": "/api/deployment/docker",
            "containers": "/containers",
            "container_stats": "/containers/{container_id}/stats",
            "container_logs": "/containers/{container_id}/logs",
            "stop": "/containers/{container_id}/stop",
            "restart": "/containers/{container_id}/restart",
            "remove": "/containers/{container_id}/remove",
            "history": "/history",
            "autoscaler_status": "/autoscaler/status",
            "autoscaler_events": "/autoscaler/events",
            "autoscaler_groups": "/autoscaler/groups",
            "metrics": "/metrics",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    docker_connected = check_docker_connection()
    update_container_metrics()
    return {
        "status": "ok",
        "timestamp": time.time(),
        "docker_connected": docker_connected,
        "phase": "Phase 3 - Autoscaling",
        "autoscaler_running": autoscaler.running,
        "replica_groups": len(autoscaler.replica_groups),
        "total_deployments": len(deployment_history)
    }


@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    update_container_metrics()
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/deploy", response_model=DeployResponse)
def deploy(req: DeployImageRequest):
    """Deploy a Docker container from an image with optional autoscaling."""
    # Pull the Docker image
    try:
        print(f"Pulling image: {req.image_name}")
        run_docker_command(['pull', req.image_name])
    except Exception as e:
        deployments_failed.inc()
        raise HTTPException(status_code=400, detail=f"Failed to pull image: {str(e)}")
    
    # Find a free port
    try:
        host_port = find_free_port()
    except RuntimeError as e:
        deployments_failed.inc()
        raise HTTPException(status_code=500, detail=str(e))
    
    # Prepare container name
    container_name = req.name if req.name else None
    replica_group_name = None
    
    # Build docker run command
    docker_args = [
        'run', '-d',
        '--label', 'managed_by=intelliscalesim',
        '--label', 'deployment_type=image',
        '-p', f'{host_port}:{req.container_port}',
        '--memory', req.mem_limit,
        '--cpus', str(req.cpu_quota),
    ]
    
    if req.enable_autoscaling:
        # Create replica group
        replica_group_name = container_name if container_name else f"group-{int(time.time())}"
        policy = ScalingPolicy(
            name=replica_group_name,
            min_replicas=req.min_replicas,
            max_replicas=req.max_replicas
        )
        group = ReplicaGroup(
            name=replica_group_name,
            image=req.image_name,
            container_port=req.container_port,
            policy=policy,
            mem_limit=req.mem_limit,
            cpu_quota=req.cpu_quota
        )
        autoscaler.register_replica_group(group)
        docker_args.extend(['--label', f'replica_group={replica_group_name}'])
        container_name = f"{replica_group_name}-replica-1"
    
    if container_name:
        docker_args.extend(['--name', container_name])
    
    docker_args.append(req.image_name)
    
    # Start the container
    try:
        print(f"Starting container on port {host_port}")
        container_id = run_docker_command(docker_args)
        deployments_total.inc()
        update_container_metrics()
        
        # Get container name if not specified
        if not container_name:
            inspect_output = run_docker_command(['inspect', '--format', '{{.Name}}', container_id])
            container_name = inspect_output.strip('/').strip()
        
        # Add to replica group if autoscaling enabled
        if req.enable_autoscaling and replica_group_name:
            autoscaler.add_replica_to_group(replica_group_name, container_id, host_port)
        
        # Add to history
        add_deployment_history("image", {
            "image": req.image_name,
            "container_id": container_id[:12],
            "container_name": container_name,
            "host_port": host_port,
            "autoscaling_enabled": req.enable_autoscaling,
            "replica_group": replica_group_name
        })
        
    except Exception as e:
        deployments_failed.inc()
        raise HTTPException(status_code=500, detail=f"Failed to start container: {str(e)}")
    
    return DeployResponse(
        message="Container deployed successfully",
        container_id=container_id[:12],
        container_name=container_name,
        host_port=host_port,
        url=f"http://localhost:{host_port}",
        deployment_type="image",
        autoscaling_enabled=req.enable_autoscaling,
        replica_group=replica_group_name
    )


@app.post("/deploy_git", response_model=DeployResponse)
def deploy_git(req: DeployGitRequest):
    """Deploy from GitHub repository with Dockerfile and optional autoscaling."""
    import git
    
    # Generate unique build directory
    build_id = f"build_{int(time.time())}"
    build_path = os.path.join(TEMP_DIR, build_id)
    
    try:
        # Clone repository
        print(f"Cloning repository: {req.repo_url}")
        try:
            git.Repo.clone_from(req.repo_url, build_path, branch=req.branch, depth=1)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")
        
        # Check if Dockerfile exists
        dockerfile_full_path = os.path.join(build_path, req.dockerfile_path)
        if not os.path.exists(dockerfile_full_path):
            shutil.rmtree(build_path, ignore_errors=True)
            raise HTTPException(status_code=400, detail=f"Dockerfile not found at {req.dockerfile_path}")
        
        # Build Docker image
        image_tag = f"intelliscalesim/{build_id}:latest"
        print(f"Building Docker image: {image_tag}")
        
        try:
            build_args = ['build', '-t', image_tag, '-f', dockerfile_full_path, build_path]
            run_docker_command(build_args, capture_output=False)
        except Exception as e:
            shutil.rmtree(build_path, ignore_errors=True)
            raise HTTPException(status_code=500, detail=f"Failed to build image: {str(e)}")
        
        # Find free port
        try:
            host_port = find_free_port()
        except RuntimeError as e:
            shutil.rmtree(build_path, ignore_errors=True)
            deployments_failed.inc()
            raise HTTPException(status_code=500, detail=str(e))
        
        # Prepare container name
        container_name = req.name if req.name else None
        replica_group_name = None
        
        # Run container
        docker_args = [
            'run', '-d',
            '--label', 'managed_by=intelliscalesim',
            '--label', 'deployment_type=github',
            '--label', f'repo={req.repo_url}',
            '-p', f'{host_port}:{req.container_port}',
            '--memory', req.mem_limit,
            '--cpus', str(req.cpu_quota),
        ]
        
        if req.enable_autoscaling:
            # Create replica group
            replica_group_name = container_name if container_name else f"github-group-{int(time.time())}"
            policy = ScalingPolicy(
                name=replica_group_name,
                min_replicas=req.min_replicas,
                max_replicas=req.max_replicas
            )
            group = ReplicaGroup(
                name=replica_group_name,
                image=image_tag,
                container_port=req.container_port,
                policy=policy,
                mem_limit=req.mem_limit,
                cpu_quota=req.cpu_quota
            )
            autoscaler.register_replica_group(group)
            docker_args.extend(['--label', f'replica_group={replica_group_name}'])
            container_name = f"{replica_group_name}-replica-1"
        
        if container_name:
            docker_args.extend(['--name', container_name])
        
        docker_args.append(image_tag)
        
        try:
            container_id = run_docker_command(docker_args)
            deployments_total.inc()
            github_deployments_total.inc()
            update_container_metrics()
            
            # Get container name if not specified
            if not container_name:
                inspect_output = run_docker_command(['inspect', '--format', '{{.Name}}', container_id])
                container_name = inspect_output.strip('/').strip()
            
            # Add to replica group if autoscaling enabled
            if req.enable_autoscaling and replica_group_name:
                autoscaler.add_replica_to_group(replica_group_name, container_id, host_port)
            
            # Add to history
            add_deployment_history("github", {
                "repo": req.repo_url,
                "branch": req.branch,
                "image": image_tag,
                "container_id": container_id[:12],
                "container_name": container_name,
                "host_port": host_port,
                "autoscaling_enabled": req.enable_autoscaling,
                "replica_group": replica_group_name
            })
            
        except Exception as e:
            deployments_failed.inc()
            raise HTTPException(status_code=500, detail=f"Failed to start container: {str(e)}")
        finally:
            # Cleanup build directory
            shutil.rmtree(build_path, ignore_errors=True)
        
        return DeployResponse(
            message="Container deployed from GitHub successfully",
            container_id=container_id[:12],
            container_name=container_name,
            host_port=host_port,
            url=f"http://localhost:{host_port}",
            deployment_type="github",
            autoscaling_enabled=req.enable_autoscaling,
            replica_group=replica_group_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on any error
        if os.path.exists(build_path):
            shutil.rmtree(build_path, ignore_errors=True)
        deployments_failed.inc()
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")


@app.get("/containers")
def list_containers(all: bool = Query(False, description="Show all containers including stopped")):
    """List all containers managed by IntelliScaleSim."""
    try:
        # Get container IDs
        ps_args = ['ps', '-q', '--filter', 'label=managed_by=intelliscalesim']
        if all:
            ps_args.insert(1, '-a')
        
        container_ids = run_docker_command(ps_args)
        
        if not container_ids.strip():
            return {"containers": [], "count": 0}
        
        containers = []
        for container_id in container_ids.split('\n'):
            if not container_id.strip():
                continue
            
            # Get container details
            inspect_cmd = [
                'inspect',
                '--format',
                '{{.Id}}|{{.Name}}|{{.State.Status}}|{{.Config.Image}}|{{index .Config.Labels "deployment_type"}}|{{index .Config.Labels "replica_group"}}',
                container_id
            ]
            details = run_docker_command(inspect_cmd)
            
            parts = details.split('|')
            containers.append({
                "id": parts[0][:12],
                "name": parts[1].strip('/'),
                "status": parts[2],
                "image": parts[3],
                "deployment_type": parts[4] if len(parts) > 4 and parts[4] != "<no value>" else "unknown",
                "replica_group": parts[5] if len(parts) > 5 and parts[5] != "<no value>" else None
            })
        
        update_container_metrics()
        return {"containers": containers, "count": len(containers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list containers: {str(e)}")


@app.get("/containers/{container_id}/stats")
def container_stats(container_id: str):
    """Get real-time stats for a container."""
    try:
        # Get stats (one-shot, no stream)
        stats_output = run_docker_command([
            'stats', container_id, '--no-stream', '--format',
            '{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}|{{.BlockIO}}'
        ])
        
        parts = stats_output.split('|')
        
        return {
            "container_id": container_id,
            "cpu_percent": parts[0],
            "memory_usage": parts[1],
            "network_io": parts[2],
            "block_io": parts[3],
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Container not found or stats unavailable: {str(e)}")


@app.get("/containers/{container_id}/logs")
def container_logs(
    container_id: str,
    tail: int = Query(100, description="Number of lines to return")
):
    """Get logs from a container."""
    try:
        logs = run_docker_command(['logs', '--tail', str(tail), container_id])
        return {
            "container_id": container_id,
            "logs": logs,
            "lines": len(logs.split('\n'))
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Container not found: {str(e)}")


@app.post("/containers/{container_id}/stop", response_model=ContainerActionResponse)
def stop_container(container_id: str):
    """Stop a running container."""
    try:
        run_docker_command(['stop', container_id])
        update_container_metrics()
        return ContainerActionResponse(
            message="Container stopped successfully",
            container_id=container_id,
            action="stop"
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to stop container: {str(e)}")


@app.post("/containers/{container_id}/restart", response_model=ContainerActionResponse)
def restart_container(container_id: str):
    """Restart a container."""
    try:
        run_docker_command(['restart', container_id])
        return ContainerActionResponse(
            message="Container restarted successfully",
            container_id=container_id,
            action="restart"
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to restart container: {str(e)}")


@app.delete("/containers/{container_id}/remove", response_model=ContainerActionResponse)
def remove_container(container_id: str, force: bool = Query(False, description="Force remove running container")):
    """Remove a container."""
    try:
        remove_args = ['rm', container_id]
        if force:
            remove_args.insert(1, '-f')
        
        run_docker_command(remove_args)
        update_container_metrics()
        return ContainerActionResponse(
            message="Container removed successfully",
            container_id=container_id,
            action="remove"
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to remove container: {str(e)}")


@app.get("/history")
def get_deployment_history(limit: int = Query(50, ge=1, le=100)):
    """Get deployment history."""
    return {
        "deployments": deployment_history[-limit:],
        "total": len(deployment_history)
    }


# ===== AUTOSCALER ENDPOINTS =====

@app.get("/autoscaler/status")
def get_autoscaler_status():
    """Get autoscaler status and all replica groups."""
    return autoscaler.get_status()


@app.get("/autoscaler/events")
def get_autoscaler_events(limit: int = Query(50, ge=1, le=200)):
    """Get recent autoscaling events."""
    return {
        "events": autoscaler.get_scaling_events(limit),
        "total": len(autoscaler.scaling_events)
    }


@app.get("/autoscaler/groups")
def get_replica_groups():
    """Get all replica groups with details."""
    groups = []
    for group_name, group in autoscaler.replica_groups.items():
        groups.append({
            "name": group.name,
            "image": group.image,
            "container_port": group.container_port,
            "replicas": len(group.replicas),
            "replica_ids": [rid[:12] for rid in group.replicas],
            "ports": group.ports,
            "policy": {
                "min_replicas": group.policy.min_replicas,
                "max_replicas": group.policy.max_replicas,
                "cpu_scale_up_threshold": group.policy.cpu_scale_up_threshold,
                "cpu_scale_down_threshold": group.policy.cpu_scale_down_threshold,
                "cooldown_seconds": group.policy.cooldown_seconds
            },
            "created_at": group.created_at.isoformat()
        })
    
    return {
        "replica_groups": groups,
        "count": len(groups)
    }


@app.post("/autoscaler/start")
def start_autoscaler():
    """Start the autoscaler."""
    autoscaler.start()
    return {"message": "Autoscaler started", "running": autoscaler.running}


@app.post("/autoscaler/stop")
def stop_autoscaler():
    """Stop the autoscaler."""
    autoscaler.stop()
    return {"message": "Autoscaler stopped", "running": autoscaler.running}

