from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import time
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="IntelliScaleSim API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Helper Functions
# ============================================

def run_docker_command(command: List[str]) -> str:
    """Execute Docker CLI command"""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {e.stderr}")

def get_container_stats(container_id: str) -> dict:
    """Get real-time stats for a container"""
    try:
        stats_cmd = [
            "docker", "stats", container_id,
            "--no-stream", "--format",
            '{"cpu":"{{.CPUPerc}}","mem":"{{.MemPerc}}","mem_usage":"{{.MemUsage}}"}'
        ]
        stats_output = run_docker_command(stats_cmd)
        return json.loads(stats_output)
    except:
        return {"cpu": "0%", "mem": "0%", "mem_usage": "0B / 0B"}

# ============================================
# Startup Event
# ============================================

@app.on_event("startup")
async def startup_event():
    """Check Docker connection on startup"""
    try:
        subprocess.run(["docker", "info"], capture_output=True, check=True)
        print("✅ Connected to Docker daemon via CLI")
    except Exception as e:
        print(f"⚠️  Warning: Could not connect to Docker: {e}")

@app.on_event("startup")
async def startup_message():
    print("🚀 Starting IntelliScaleSim API...")
    print("✅ Database initialized!")
    print("✅ Server ready!")

# ============================================
# Health Check
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "IntelliScaleSim API is running",
        "timestamp": datetime.now().isoformat()
    }

# ============================================
# Docker Hub Deployment Endpoint
# ============================================

@app.post("/deploy/docker-image")
async def deploy_docker_image(request: Request):
    """Deploy container from Docker Hub"""
    try:
        data = await request.json()
        
        image = data.get("image")
        container_name = data.get("container_name", "")
        port = data.get("port")
        username = data.get("username", "")
        password = data.get("password", "")
        
        # Validation
        if not image or not port:
            raise HTTPException(status_code=400, detail="Image and port are required")
        
        # Login to Docker Hub if credentials provided
        if username and password:
            try:
                login_cmd = f"echo {password} | docker login -u {username} --password-stdin"
                subprocess.run(login_cmd, shell=True, check=True, capture_output=True)
                print(f"✅ Logged in to Docker Hub as {username}")
            except subprocess.CalledProcessError as e:
                raise HTTPException(status_code=401, detail="Docker Hub authentication failed")
        
        # Pull image
        print(f"📥 Pulling image: {image}")
        try:
            subprocess.run(["docker", "pull", image], check=True, capture_output=True, text=True)
            print(f"✅ Image pulled: {image}")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to pull image: {e.stderr}")
        
        # Generate container name if not provided
        if not container_name:
            container_name = f"container-{image.replace(':', '-').replace('/', '-')}-{int(time.time())}"
        
        # Run container
        print(f"🚀 Starting container: {container_name}")
        run_cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "-p", f"{port}:{port}",
            image
        ]
        
        try:
            result = subprocess.run(run_cmd, capture_output=True, text=True, check=True)
            container_id = result.stdout.strip()
            print(f"✅ Container started: {container_id[:12]}")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to start container: {e.stderr}")
        
        return {
            "success": True,
            "message": "Deployment successful",
            "container_id": container_id,
            "container_name": container_name,
            "image": image,
            "port": port
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

# ============================================
# GitHub Deployment Endpoint
# ============================================

@app.post("/deploy/github")
async def deploy_github(request: Request):
    """Deploy from GitHub repository"""
    try:
        data = await request.json()
        
        repo_url = data.get("repo_url")
        branch = data.get("branch", "main")
        dockerfile_path = data.get("dockerfile_path", "Dockerfile")
        container_name = data.get("container_name", "")
        port = data.get("port")
        
        if not repo_url or not port:
            raise HTTPException(status_code=400, detail="Repository URL and port are required")
        
        # Generate unique container name
        if not container_name:
            repo_name = repo_url.split("/")[-1].replace(".git", "")
            container_name = f"{repo_name}-{int(time.time())}"
        
        image_name = f"{container_name}:latest"
        
        # Clone repository
        print(f"📥 Cloning repository: {repo_url}")
        clone_dir = f"/tmp/{container_name}"
        try:
            subprocess.run(["git", "clone", "-b", branch, repo_url, clone_dir], check=True, capture_output=True)
            print(f"✅ Repository cloned to {clone_dir}")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to clone repository: {e.stderr}")
        
        # Build Docker image
        print(f"🔨 Building Docker image: {image_name}")
        try:
            subprocess.run(
                ["docker", "build", "-t", image_name, "-f", f"{clone_dir}/{dockerfile_path}", clone_dir],
                check=True,
                capture_output=True
            )
            print(f"✅ Image built: {image_name}")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to build image: {e.stderr}")
        
        # Run container
        print(f"🚀 Starting container: {container_name}")
        run_cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "-p", f"{port}:{port}",
            image_name
        ]
        
        try:
            result = subprocess.run(run_cmd, capture_output=True, text=True, check=True)
            container_id = result.stdout.strip()
            print(f"✅ Container started: {container_id[:12]}")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Failed to start container: {e.stderr}")
        
        # Cleanup
        subprocess.run(["rm", "-rf", clone_dir], check=False)
        
        return {
            "success": True,
            "message": "Deployment successful",
            "container_id": container_id,
            "container_name": container_name,
            "image": image_name,
            "port": port
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

# ============================================
# Container Metrics Endpoint
# ============================================

@app.get("/api/metrics/containers")
async def get_container_metrics():
    """Get metrics for all running containers"""
    try:
        # Get all running containers
        containers_cmd = [
            "docker", "ps",
            "--format", '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","ports":"{{.Ports}}"}'
        ]
        containers_output = run_docker_command(containers_cmd)
        
        if not containers_output:
            return []
        
        containers = []
        for line in containers_output.split('\n'):
            if line.strip():
                container = json.loads(line)
                stats = get_container_stats(container['id'])
                containers.append({
                    **container,
                    "cpu": stats.get("cpu", "0%"),
                    "memory": stats.get("mem", "0%"),
                    "memory_usage": stats.get("mem_usage", "0B / 0B")
                })
        
        return containers
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

# ============================================
# Container Management Endpoints
# ============================================

@app.get("/api/containers")
async def list_containers():
    """List all containers"""
    try:
        containers_cmd = [
            "docker", "ps", "-a",
            "--format", '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","ports":"{{.Ports}}"}'
        ]
        containers_output = run_docker_command(containers_cmd)
        
        if not containers_output:
            return []
        
        containers = []
        for line in containers_output.split('\n'):
            if line.strip():
                containers.append(json.loads(line))
        
        return containers
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list containers: {str(e)}")

@app.post("/api/containers/{container_id}/stop")
async def stop_container(container_id: str):
    """Stop a container"""
    try:
        run_docker_command(["docker", "stop", container_id])
        return {"success": True, "message": f"Container {container_id} stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/containers/{container_id}/start")
async def start_container(container_id: str):
    """Start a container"""
    try:
        run_docker_command(["docker", "start", container_id])
        return {"success": True, "message": f"Container {container_id} started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/containers/{container_id}")
async def delete_container(container_id: str):
    """Delete a container"""
    try:
        run_docker_command(["docker", "rm", "-f", container_id])
        return {"success": True, "message": f"Container {container_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
