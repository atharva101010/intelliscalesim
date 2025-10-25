"""
Autoscaling engine for IntelliScaleSim
Monitors container metrics and automatically scales up/down based on CPU usage
"""

import time
import threading
import subprocess
from typing import Dict, List, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScalingPolicy:
    """Defines scaling behavior for a container group"""
    def __init__(
        self,
        name: str,
        min_replicas: int = 1,
        max_replicas: int = 5,
        cpu_scale_up_threshold: float = 70.0,
        cpu_scale_down_threshold: float = 30.0,
        cooldown_seconds: int = 60
    ):
        self.name = name
        self.min_replicas = min_replicas
        self.max_replicas = max_replicas
        self.cpu_scale_up_threshold = cpu_scale_up_threshold
        self.cpu_scale_down_threshold = cpu_scale_down_threshold
        self.cooldown_seconds = cooldown_seconds
        self.last_scale_time = 0


class ReplicaGroup:
    """Manages a group of container replicas"""
    def __init__(
        self,
        name: str,
        image: str,
        container_port: int,
        policy: ScalingPolicy,
        mem_limit: str = "512m",
        cpu_quota: float = 0.5
    ):
        self.name = name
        self.image = image
        self.container_port = container_port
        self.policy = policy
        self.mem_limit = mem_limit
        self.cpu_quota = cpu_quota
        self.replicas: List[str] = []  # List of container IDs
        self.ports: List[int] = []  # List of assigned ports
        self.created_at = datetime.now()


class Autoscaler:
    """Main autoscaling engine"""
    
    def __init__(self, check_interval: int = 30):
        self.check_interval = check_interval
        self.replica_groups: Dict[str, ReplicaGroup] = {}
        self.scaling_events: List[Dict] = []
        self.running = False
        self.thread: Optional[threading.Thread] = None
        
    def start(self):
        """Start the autoscaling engine"""
        if self.running:
            logger.warning("Autoscaler already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.thread.start()
        logger.info(f"✓ Autoscaler started with {self.check_interval}s check interval")
    
    def stop(self):
        """Stop the autoscaling engine"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Autoscaler stopped")
    
    def register_replica_group(self, group: ReplicaGroup):
        """Register a new replica group for autoscaling"""
        self.replica_groups[group.name] = group
        logger.info(f"✓ Registered replica group: {group.name}")
        self._log_scaling_event(group.name, "registered", f"Replica group created with policy: min={group.policy.min_replicas}, max={group.policy.max_replicas}")
    
    def unregister_replica_group(self, name: str):
        """Unregister a replica group"""
        if name in self.replica_groups:
            del self.replica_groups[name]
            logger.info(f"Unregistered replica group: {name}")
            self._log_scaling_event(name, "unregistered", "Replica group removed")
    
    def add_replica_to_group(self, group_name: str, container_id: str, port: int):
        """Add a container to a replica group"""
        if group_name in self.replica_groups:
            self.replica_groups[group_name].replicas.append(container_id)
            self.replica_groups[group_name].ports.append(port)
            logger.info(f"✓ Added replica {container_id[:12]} (port {port}) to group {group_name}")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        logger.info("🔄 Autoscaler monitoring loop started")
        while self.running:
            try:
                self._check_all_groups()
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            time.sleep(self.check_interval)
    
    def _check_all_groups(self):
        """Check all replica groups and make scaling decisions"""
        for group_name, group in list(self.replica_groups.items()):
            try:
                self._check_group(group)
            except Exception as e:
                logger.error(f"Error checking group {group_name}: {e}")
    
    def _check_group(self, group: ReplicaGroup):
        """Check a single replica group and scale if needed"""
        # Get metrics for all replicas in the group
        total_cpu = 0.0
        active_replicas = []
        
        for container_id in group.replicas:
            try:
                cpu = self._get_container_cpu(container_id)
                if cpu is not None:
                    total_cpu += cpu
                    active_replicas.append(container_id)
            except Exception as e:
                logger.debug(f"Could not get CPU for {container_id[:12]}: {e}")
        
        if not active_replicas:
            logger.debug(f"No active replicas in group {group.name}")
            return
        
        # Calculate average CPU
        avg_cpu = total_cpu / len(active_replicas)
        current_replica_count = len(active_replicas)
        
        logger.info(f"📊 Group '{group.name}': {current_replica_count} replicas, avg CPU: {avg_cpu:.1f}%")
        
        # Check if we're in cooldown period
        time_since_last_scale = time.time() - group.policy.last_scale_time
        if time_since_last_scale < group.policy.cooldown_seconds:
            cooldown_remaining = group.policy.cooldown_seconds - time_since_last_scale
            logger.debug(f"Group {group.name} in cooldown ({cooldown_remaining:.0f}s remaining)")
            return
        
        # Make scaling decision
        if avg_cpu > group.policy.cpu_scale_up_threshold and current_replica_count < group.policy.max_replicas:
            logger.warning(f"⬆️  High CPU detected ({avg_cpu:.1f}% > {group.policy.cpu_scale_up_threshold}%) - Scaling UP")
            self._scale_up(group, avg_cpu)
        elif avg_cpu < group.policy.cpu_scale_down_threshold and current_replica_count > group.policy.min_replicas:
            logger.info(f"⬇️  Low CPU detected ({avg_cpu:.1f}% < {group.policy.cpu_scale_down_threshold}%) - Scaling DOWN")
            self._scale_down(group, avg_cpu)
    
    def _get_container_cpu(self, container_id: str) -> Optional[float]:
        """Get CPU usage for a container"""
        try:
            result = subprocess.run(
                ['docker', 'stats', container_id, '--no-stream', '--format', '{{.CPUPerc}}'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                cpu_str = result.stdout.strip().rstrip('%')
                return float(cpu_str)
        except Exception as e:
            logger.debug(f"Error getting CPU for {container_id[:12]}: {e}")
        return None
    
    def _scale_up(self, group: ReplicaGroup, avg_cpu: float):
        """Scale up a replica group"""
        logger.info(f"🚀 SCALING UP group '{group.name}' (current: {len(group.replicas)} → target: {len(group.replicas) + 1})")
        
        try:
            # Import here to avoid circular dependency
            from .main import find_free_port, run_docker_command
            
            # Find free port
            host_port = find_free_port()
            
            # Build docker run command for replica
            replica_name = f"{group.name}-replica-{len(group.replicas) + 1}"
            docker_args = [
                'run', '-d',
                '--name', replica_name,
                '--label', 'managed_by=intelliscalesim',
                '--label', f'replica_group={group.name}',
                '--label', 'autoscaled=true',
                '-p', f'{host_port}:{group.container_port}',
                '--memory', group.mem_limit,
                '--cpus', str(group.cpu_quota),
                group.image
            ]
            
            # Deploy the replica
            container_id = run_docker_command(docker_args)
            
            if container_id:
                group.replicas.append(container_id)
                group.ports.append(host_port)
                group.policy.last_scale_time = time.time()
                
                self._log_scaling_event(
                    group.name,
                    "scale_up",
                    f"Added replica {container_id[:12]} on port {host_port}. Reason: CPU {avg_cpu:.1f}% > {group.policy.cpu_scale_up_threshold}%. Total replicas: {len(group.replicas)}"
                )
                logger.info(f"✅ Successfully scaled UP '{group.name}' to {len(group.replicas)} replicas (new replica: {replica_name} on port {host_port})")
        except Exception as e:
            logger.error(f"❌ Failed to scale up {group.name}: {e}")
            self._log_scaling_event(group.name, "scale_up_failed", f"Error: {str(e)}")
    
    def _scale_down(self, group: ReplicaGroup, avg_cpu: float):
        """Scale down a replica group"""
        if len(group.replicas) <= group.policy.min_replicas:
            return
        
        logger.info(f"🔽 SCALING DOWN group '{group.name}' (current: {len(group.replicas)} → target: {len(group.replicas) - 1})")
        
        try:
            # Remove the last replica
            container_id = group.replicas.pop()
            port = group.ports.pop()
            
            # Stop and remove the container
            subprocess.run(['docker', 'stop', container_id], timeout=10, capture_output=True)
            subprocess.run(['docker', 'rm', '-f', container_id], timeout=10, capture_output=True)
            
            group.policy.last_scale_time = time.time()
            
            self._log_scaling_event(
                group.name,
                "scale_down",
                f"Removed replica {container_id[:12]} (port {port}). Reason: CPU {avg_cpu:.1f}% < {group.policy.cpu_scale_down_threshold}%. Total replicas: {len(group.replicas)}"
            )
            logger.info(f"✅ Successfully scaled DOWN '{group.name}' to {len(group.replicas)} replicas")
        except Exception as e:
            logger.error(f"❌ Failed to scale down {group.name}: {e}")
            self._log_scaling_event(group.name, "scale_down_failed", f"Error: {str(e)}")
    
    def _log_scaling_event(self, group_name: str, action: str, details: str):
        """Log a scaling event"""
        event = {
            "timestamp": datetime.now().isoformat(),
            "group": group_name,
            "action": action,
            "details": details
        }
        self.scaling_events.append(event)
        
        # Keep only last 200 events
        if len(self.scaling_events) > 200:
            self.scaling_events.pop(0)
    
    def get_status(self) -> Dict:
        """Get autoscaler status"""
        groups_info = []
        for group in self.replica_groups.values():
            # Get current CPU for each replica
            replica_cpus = []
            for container_id in group.replicas:
                cpu = self._get_container_cpu(container_id)
                if cpu is not None:
                    replica_cpus.append(cpu)
            
            avg_cpu = sum(replica_cpus) / len(replica_cpus) if replica_cpus else 0.0
            
            groups_info.append({
                "name": group.name,
                "image": group.image,
                "replicas": len(group.replicas),
                "ports": group.ports,
                "min_replicas": group.policy.min_replicas,
                "max_replicas": group.policy.max_replicas,
                "cpu_scale_up_threshold": group.policy.cpu_scale_up_threshold,
                "cpu_scale_down_threshold": group.policy.cpu_scale_down_threshold,
                "current_avg_cpu": round(avg_cpu, 2),
                "cooldown_seconds": group.policy.cooldown_seconds
            })
        
        return {
            "running": self.running,
            "check_interval": self.check_interval,
            "replica_groups_count": len(self.replica_groups),
            "total_replicas": sum(len(group.replicas) for group in self.replica_groups.values()),
            "groups": groups_info
        }
    
    def get_scaling_events(self, limit: int = 50) -> List[Dict]:
        """Get recent scaling events"""
        return self.scaling_events[-limit:]


# Global autoscaler instance
autoscaler = Autoscaler(check_interval=30)
