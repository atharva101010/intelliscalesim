import time
import json
import subprocess
import threading
from datetime import datetime
from typing import Dict, List

class AutoScaler:
    def __init__(self):
        # Default thresholds
        self.cpu_scale_up_threshold = 70.0
        self.cpu_scale_down_threshold = 20.0
        self.memory_scale_up_threshold = 75.0
        self.memory_scale_down_threshold = 25.0
        
        self.min_replicas = 1
        self.max_replicas = 5
        self.check_interval = 30
        
        self.scaling_rules = {}
        self.scaling_history = []
        self.running = False
        
    def run_docker_command(self, cmd: str) -> str:
        """Execute Docker command"""
        try:
            result = subprocess.run(f"docker {cmd}", shell=True, capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            print(f"Error running docker command: {e}")
            return ""
    
    def get_container_stats(self) -> List[Dict]:
        """Get current stats for all containers with intelliscalesim label"""
        try:
            # Get all container stats first
            cmd = 'stats --no-stream --format "{{json .}}"'
            result = subprocess.run(f"docker {cmd}", shell=True, capture_output=True, text=True)
            output = result.stdout
            
            stats = []
            if output.strip():
                for line in output.strip().split('\n'):
                    if line.strip():
                        try:
                            stat = json.loads(line)
                            container_id = stat.get("ID", "")[:12]
                            
                            # Check if container has intelliscalesim label
                            inspect_cmd = f'inspect {container_id} --format "{{{{.Config.Labels.intelliscalesim}}}}"'
                            inspect_result = subprocess.run(f"docker {inspect_cmd}", shell=True, capture_output=True, text=True)
                            
                            if inspect_result.stdout.strip() != "true":
                                continue
                            
                            # Parse CPU and Memory percentages
                            cpu_str = stat.get("CPUPerc", "0%").replace("%", "")
                            mem_str = stat.get("MemPerc", "0%").replace("%", "")
                            
                            try:
                                cpu_percent = float(cpu_str)
                                mem_percent = float(mem_str)
                            except:
                                cpu_percent = 0.0
                                mem_percent = 0.0
                            
                            stats.append({
                                "id": container_id,
                                "name": stat.get("Name", ""),
                                "cpu": cpu_percent,
                                "memory": mem_percent
                            })
                        except Exception as e:
                            print(f"Error parsing container stat: {e}")
                            continue
            
            return stats
        except Exception as e:
            print(f"Error getting container stats: {e}")
            return []
    
    def get_container_info(self, container_id: str) -> Dict:
        """Get detailed container information"""
        try:
            cmd = f"inspect {container_id}"
            output = self.run_docker_command(cmd)
            if output:
                info = json.loads(output)[0]
                return {
                    "image": info["Config"]["Image"],
                    "labels": info["Config"]["Labels"],
                    "ports": info["NetworkSettings"]["Ports"]
                }
        except:
            pass
        return {}
    
    def scale_up(self, container_name: str, container_id: str):
        """Scale up by creating additional replica"""
        try:
            info = self.get_container_info(container_id)
            if not info:
                return False
            
            current_replicas = self.scaling_rules.get(container_name, {}).get("replicas", 1)
            if current_replicas >= self.max_replicas:
                print(f"Already at max replicas ({self.max_replicas}) for {container_name}")
                return False
            
            image = info["image"]
            new_replica_name = f"{container_name}_replica_{current_replicas + 1}"
            
            # Get port mapping
            port_mapping = ""
            if info.get("ports"):
                for container_port, host_bindings in info["ports"].items():
                    if host_bindings:
                        base_port = int(host_bindings[0]["HostPort"])
                        new_port = base_port + current_replicas
                        port_mapping = f"-p {new_port}:{container_port.split('/')[0]}"
            
            # Create new container
            cmd = f"run -d --name {new_replica_name} {port_mapping} --label intelliscalesim=true --label parent={container_name} {image}"
            self.run_docker_command(cmd)
            
            # Update replica count
            if container_name not in self.scaling_rules:
                self.scaling_rules[container_name] = {"enabled": True, "replicas": 1}
            self.scaling_rules[container_name]["replicas"] += 1
            
            # Log scaling event
            self.scaling_history.append({
                "timestamp": datetime.now().isoformat(),
                "container": container_name,
                "action": "SCALE_UP",
                "replicas": self.scaling_rules[container_name]["replicas"]
            })
            
            print(f"✅ SCALED UP: {container_name} to {self.scaling_rules[container_name]['replicas']} replicas")
            return True
            
        except Exception as e:
            print(f"Error scaling up {container_name}: {e}")
            return False
    
    def scale_down(self, container_name: str):
        """Scale down by removing a replica"""
        try:
            current_replicas = self.scaling_rules.get(container_name, {}).get("replicas", 1)
            if current_replicas <= self.min_replicas:
                print(f"Already at min replicas ({self.min_replicas}) for {container_name}")
                return False
            
            # Find and remove a replica
            cmd = f"ps --format json --filter label=parent={container_name}"
            output = self.run_docker_command(cmd)
            
            if output:
                for line in output.strip().split('\n'):
                    if line.strip():
                        container = json.loads(line)
                        replica_id = container["ID"]
                        
                        # Remove this replica
                        self.run_docker_command(f"rm -f {replica_id}")
                        
                        # Update replica count
                        self.scaling_rules[container_name]["replicas"] -= 1
                        
                        # Log scaling event
                        self.scaling_history.append({
                            "timestamp": datetime.now().isoformat(),
                            "container": container_name,
                            "action": "SCALE_DOWN",
                            "replicas": self.scaling_rules[container_name]["replicas"]
                        })
                        
                        print(f"✅ SCALED DOWN: {container_name} to {self.scaling_rules[container_name]['replicas']} replicas")
                        return True
            
            return False
            
        except Exception as e:
            print(f"Error scaling down {container_name}: {e}")
            return False
    
    def check_and_scale(self):
        """Check metrics and perform scaling if needed"""
        stats = self.get_container_stats()
        
        for stat in stats:
            container_name = stat["name"]
            
            # Skip if autoscaling not enabled for this container
            if container_name not in self.scaling_rules:
                continue
            
            if not self.scaling_rules[container_name].get("enabled", False):
                continue
            
            cpu = stat["cpu"]
            memory = stat["memory"]
            
            print(f"📊 Checking {container_name}: CPU={cpu}%, Memory={memory}%")
            
            # Check if we need to scale up
            if cpu > self.cpu_scale_up_threshold or memory > self.memory_scale_up_threshold:
                print(f"⚠️  HIGH USAGE DETECTED: {container_name} - CPU: {cpu}%, Memory: {memory}%")
                self.scale_up(container_name, stat["id"])
            
            # Check if we need to scale down
            elif cpu < self.cpu_scale_down_threshold and memory < self.memory_scale_down_threshold:
                current_replicas = self.scaling_rules[container_name].get("replicas", 1)
                if current_replicas > self.min_replicas:
                    print(f"ℹ️  LOW USAGE DETECTED: {container_name} - CPU: {cpu}%, Memory: {memory}%")
                    self.scale_down(container_name)
    
    def start(self):
        """Start autoscaler background thread"""
        if self.running:
            return
        
        self.running = True
        
        def monitor_loop():
            print("🚀 Auto-scaler started!")
            while self.running:
                try:
                    self.check_and_scale()
                except Exception as e:
                    print(f"Error in autoscaler loop: {e}")
                time.sleep(self.check_interval)
        
        self.thread = threading.Thread(target=monitor_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Stop autoscaler"""
        self.running = False
        print("🛑 Auto-scaler stopped")
    
    def enable_for_container(self, container_name: str):
        """Enable autoscaling for a container"""
        if container_name not in self.scaling_rules:
            self.scaling_rules[container_name] = {"enabled": True, "replicas": 1}
        else:
            self.scaling_rules[container_name]["enabled"] = True
        print(f"✅ Autoscaling enabled for {container_name}")
    
    def disable_for_container(self, container_name: str):
        """Disable autoscaling for a container"""
        if container_name in self.scaling_rules:
            self.scaling_rules[container_name]["enabled"] = False
        print(f"⛔ Autoscaling disabled for {container_name}")
    
    def get_status(self) -> Dict:
        """Get current autoscaler status"""
        return {
            "running": self.running,
            "thresholds": {
                "cpu_scale_up": self.cpu_scale_up_threshold,
                "cpu_scale_down": self.cpu_scale_down_threshold,
                "memory_scale_up": self.memory_scale_up_threshold,
                "memory_scale_down": self.memory_scale_down_threshold
            },
            "limits": {
                "min_replicas": self.min_replicas,
                "max_replicas": self.max_replicas
            },
            "check_interval": self.check_interval,
            "managed_containers": self.scaling_rules,
            "history": self.scaling_history[-10:]
        }

# Global autoscaler instance
autoscaler = AutoScaler()
