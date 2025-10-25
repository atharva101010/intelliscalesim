# Add these to main.py after the metrics endpoints

from autoscaler import autoscaler

@app.on_event("startup")
async def startup_event():
    """Start autoscaler on app startup"""
    autoscaler.start()
    print("🚀 Auto-scaler started on startup!")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop autoscaler on app shutdown"""
    autoscaler.stop()

@app.get("/autoscaler/status")
def get_autoscaler_status():
    """Get autoscaler status and configuration"""
    return autoscaler.get_status()

@app.post("/autoscaler/start")
def start_autoscaler():
    """Start the autoscaler"""
    autoscaler.start()
    return {"message": "Autoscaler started", "status": "running"}

@app.post("/autoscaler/stop")
def stop_autoscaler():
    """Stop the autoscaler"""
    autoscaler.stop()
    return {"message": "Autoscaler stopped", "status": "stopped"}

@app.post("/autoscaler/enable/{container_name}")
def enable_autoscaling(container_name: str):
    """Enable autoscaling for a specific container"""
    autoscaler.enable_for_container(container_name)
    return {"message": f"Autoscaling enabled for {container_name}"}

@app.post("/autoscaler/disable/{container_name}")
def disable_autoscaling(container_name: str):
    """Disable autoscaling for a specific container"""
    autoscaler.disable_for_container(container_name)
    return {"message": f"Autoscaling disabled for {container_name}"}

@app.put("/autoscaler/config")
def update_autoscaler_config(config: dict):
    """Update autoscaler configuration"""
    if "cpu_scale_up" in config:
        autoscaler.cpu_scale_up_threshold = float(config["cpu_scale_up"])
    if "cpu_scale_down" in config:
        autoscaler.cpu_scale_down_threshold = float(config["cpu_scale_down"])
    if "memory_scale_up" in config:
        autoscaler.memory_scale_up_threshold = float(config["memory_scale_up"])
    if "memory_scale_down" in config:
        autoscaler.memory_scale_down_threshold = float(config["memory_scale_down"])
    if "min_replicas" in config:
        autoscaler.min_replicas = int(config["min_replicas"])
    if "max_replicas" in config:
        autoscaler.max_replicas = int(config["max_replicas"])
    if "check_interval" in config:
        autoscaler.check_interval = int(config["check_interval"])
    
    return {"message": "Configuration updated successfully", "config": autoscaler.get_status()}
