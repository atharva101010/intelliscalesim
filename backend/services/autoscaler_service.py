import subprocess
import time
import threading
from typing import Dict, Optional
from datetime import datetime
from database.models import AutoScalingRule
from database.connection import db_session
from services.docker_metrics_cli import docker_metrics_service

class AutoScalerService:
    def __init__(self):
        self.running = False
        self.thread = None
        self.config = {
            'cpuScaleUp': 70,
            'cpuScaleDown': 20,
            'memScaleUp': 75,
            'memScaleDown': 25,
            'minReplicas': 1,
            'maxReplicas': 5,
            'checkInterval': 30
        }
        self.scaling_history = []
        self._load_config_from_db()  # Load config from database on startup
        
    def update_config(self, new_config: Dict):
        """Update auto-scaling configuration and save to database"""
        self.config.update(new_config)
        self._save_config_to_db()  # Save to database
        print(f"✅ Auto-scaler config updated: {self.config}")
        
    def add_scaling_event(self, event_type: str, from_count: int, to_count: int, reason: str):
        """Add a scaling event to history"""
        event = {
            'id': int(time.time() * 1000),
            'type': event_type,
            'action': f'Scaled {event_type.upper()}' if event_type in ['up', 'down'] else 'Info',
            'from': from_count,
            'to': to_count,
            'reason': reason,
            'timestamp': datetime.now().isoformat(),
            'time': datetime.now().strftime('%H:%M:%S')
        }
        self.scaling_history.insert(0, event)
        if len(self.scaling_history) > 50:
            self.scaling_history.pop()
        print(f"📊 Scaling event: {event['action']} - {reason}")
        return event
        
    def scale_up_container(self, base_container_id: str) -> Dict:
        """Create a new replica of the base container"""
        try:
            # Get base container info
            inspect_cmd = ['docker', 'inspect', '--format', '{{json .}}', base_container_id]
            result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                return {'success': False, 'message': f'Failed to inspect container: {result.stderr}'}
            
            import json
            container_info = json.loads(result.stdout)
            
            # Extract configuration
            image = container_info['Config']['Image']
            labels = container_info['Config']['Labels']
            
            # Generate new container name
            base_name = container_info['Name'].lstrip('/')
            new_name = f"{base_name}-replica-{int(time.time())}"
            
            # Create new container with same config
            create_cmd = [
                'docker', 'run', '-d',
                '--name', new_name,
                '--label', 'deployed_by=student',
                '--label', f'user_id={labels.get("user_id", "student")}',
                '--label', f'user_name={labels.get("user_name", "Student")}',
                '--label', 'replica=true',
                '--label', f'base_container={base_container_id}',
                '--restart', 'unless-stopped',
                image
            ]
            
            result = subprocess.run(create_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return {'success': False, 'message': f'Failed to create replica: {result.stderr}'}
            
            new_container_id = result.stdout.strip()
            print(f"✅ Created replica: {new_name} ({new_container_id[:12]})")
            
            return {
                'success': True,
                'containerId': new_container_id[:12],
                'containerName': new_name,
                'message': 'Replica created successfully'
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}
            
    def scale_down_container(self) -> Dict:
        """Remove the newest replica container"""
        try:
            # Get all student containers
            containers = docker_metrics_service.get_student_containers()
            
            # Filter for replicas
            replicas = [c for c in containers if c.get('labels', {}).get('replica') == 'true']
            
            if not replicas:
                return {'success': False, 'message': 'No replicas to remove'}
            
            # Sort by creation time (newest first)
            replicas.sort(key=lambda x: x.get('created', ''), reverse=True)
            container_to_remove = replicas[0]
            
            # Stop and remove the container
            stop_cmd = ['docker', 'stop', container_to_remove['fullId']]
            subprocess.run(stop_cmd, capture_output=True, timeout=30)
            
            remove_cmd = ['docker', 'rm', container_to_remove['fullId']]
            result = subprocess.run(remove_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return {'success': False, 'message': f'Failed to remove container: {result.stderr}'}
            
            print(f"✅ Removed replica: {container_to_remove['name']}")
            
            return {
                'success': True,
                'containerId': container_to_remove['id'],
                'containerName': container_to_remove['name'],
                'message': 'Replica removed successfully'
            }
            
        except Exception as e:
            return {'success': False, 'message': str(e)}
            
    def check_and_scale(self):
        """Check metrics and perform scaling if needed"""
        try:
            # Get current metrics
            metrics = docker_metrics_service.get_aggregated_metrics()
            
            avg_cpu = metrics.get('avgCpu', 0)
            avg_memory = metrics.get('avgMemory', 0)
            current_replicas = metrics.get('runningContainers', 0)
            
            config = self.config
            
            # Check if we need to scale up
            if (avg_cpu >= config['cpuScaleUp'] or avg_memory >= config['memScaleUp']):
                if current_replicas < config['maxReplicas']:
                    print(f"🔺 Scale UP triggered: CPU={avg_cpu}%, Memory={avg_memory}%, Replicas={current_replicas}")
                    
                    # Get base container (first non-replica or any container)
                    containers = metrics.get('containers', [])
                    base_container = next((c for c in containers if c['status'] == 'running'), None)
                    
                    if base_container:
                        result = self.scale_up_container(base_container['fullId'])
                        if result['success']:
                            reason = f"CPU: {avg_cpu}%, Memory: {avg_memory}%"
                            self.add_scaling_event('up', current_replicas, current_replicas + 1, reason)
                        else:
                            print(f"❌ Scale up failed: {result['message']}")
                else:
                    print(f"⚠️ Already at max replicas ({config['maxReplicas']})")
                    
            # Check if we need to scale down
            elif (avg_cpu <= config['cpuScaleDown'] and avg_memory <= config['memScaleDown']):
                if current_replicas > config['minReplicas']:
                    print(f"🔻 Scale DOWN triggered: CPU={avg_cpu}%, Memory={avg_memory}%, Replicas={current_replicas}")
                    
                    result = self.scale_down_container()
                    if result['success']:
                        reason = f"CPU: {avg_cpu}%, Memory: {avg_memory}%"
                        self.add_scaling_event('down', current_replicas, current_replicas - 1, reason)
                    else:
                        print(f"❌ Scale down failed: {result['message']}")
                else:
                    print(f"⚠️ Already at min replicas ({config['minReplicas']})")
            else:
                print(f"✓ Metrics within range: CPU={avg_cpu}%, Memory={avg_memory}%, Replicas={current_replicas}")
                
        except Exception as e:
            print(f"❌ Error in check_and_scale: {e}")
            
    def run(self):
        """Main auto-scaling loop"""
        print(f"🚀 Auto-scaler started with config: {self.config}")
        self.add_scaling_event('info', 0, 0, 'Auto-scaler started')
        
        while self.running:
            self.check_and_scale()
            time.sleep(self.config['checkInterval'])
            
        print("🛑 Auto-scaler stopped")
        self.add_scaling_event('info', 0, 0, 'Auto-scaler stopped')
        
    def start(self) -> Dict:
        """Start the auto-scaler"""
        if self.running:
            return {'success': False, 'message': 'Auto-scaler already running'}
        
        self.running = True
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()
        
        return {'success': True, 'message': 'Auto-scaler started', 'config': self.config}
        
    def stop(self) -> Dict:
        """Stop the auto-scaler"""
        if not self.running:
            return {'success': False, 'message': 'Auto-scaler not running'}
        
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
            
        return {'success': True, 'message': 'Auto-scaler stopped'}
        
    def get_status(self) -> Dict:
        """Get current auto-scaler status"""
        metrics = docker_metrics_service.get_aggregated_metrics()
        
        return {
            'running': self.running,
            'config': self.config,
            'currentMetrics': {
                'avgCpu': metrics.get('avgCpu', 0),
                'avgMemory': metrics.get('avgMemory', 0),
                'runningContainers': metrics.get('runningContainers', 0),
                'totalContainers': metrics.get('totalContainers', 0)
            },
            'history': self.scaling_history[:20]
        }


# Create singleton instance

    def _save_config_to_db(self):
        """Save global autoscaling config to database as a special rule"""
        try:
            # Use a special container_name '__global__' for global config
            rule = db_session.query(AutoScalingRule).filter(
                AutoScalingRule.container_name == '__global__'
            ).first()
            
            if not rule:
                rule = AutoScalingRule(
                    container_name='__global__',
                    user_id='system',
                    enabled=True
                )
                db_session.add(rule)
            
            # Save config to the rule
            rule.min_replicas = self.config.get('minReplicas', 1)
            rule.max_replicas = self.config.get('maxReplicas', 5)
            rule.cpu_threshold = self.config.get('cpuScaleUp', 70)
            rule.memory_threshold = self.config.get('memScaleUp', 75)
            rule.cpu_scale_down = self.config.get('cpuScaleDown', 20)
            rule.memory_scale_down = self.config.get('memScaleDown', 25)
            rule.check_interval = self.config.get('checkInterval', 30)
            rule.updated_at = datetime.now()
            
            db_session.commit()
            print("✅ Auto-scaling config saved to database")
        except Exception as e:
            db_session.rollback()
            print(f"❌ Failed to save config to database: {e}")
    
    def _load_config_from_db(self):
        """Load global autoscaling config from database"""
        try:
            rule = db_session.query(AutoScalingRule).filter(
                AutoScalingRule.container_name == '__global__'
            ).first()
            
            if rule:
                self.config.update({
                    'minReplicas': rule.min_replicas or 1,
                    'maxReplicas': rule.max_replicas or 5,
                    'cpuScaleUp': rule.cpu_threshold or 70,
                    'memScaleUp': rule.memory_threshold or 75,
                    'cpuScaleDown': rule.cpu_scale_down or 20,
                    'memScaleDown': rule.memory_scale_down or 25,
                    'checkInterval': rule.check_interval or 30
                })
                print("✅ Auto-scaling config loaded from database")
        except Exception as e:
            print(f"⚠️  Failed to load config from database: {e}")


autoscaler_service = AutoScalerService()
