import subprocess
import json
from datetime import datetime
from typing import List, Dict, Optional

class DockerMetricsService:
    def __init__(self):
        try:
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print("✅ Connected to Docker daemon via CLI")
                self.connected = True
            else:
                print(f"❌ Docker CLI failed: {result.stderr}")
                self.connected = False
        except Exception as e:
            print(f"❌ Failed to connect to Docker: {e}")
            self.connected = False

    def get_student_containers(self, user_id: Optional[str] = None) -> List[Dict]:
        if not self.connected:
            return []
        
        try:
            cmd = ['docker', 'ps', '-a', '--filter', 'label=deployed_by=student', '--format', '{{json .}}']
            if user_id:
                cmd.extend(['--filter', f'label=user_id={user_id}'])
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                print(f"Error getting containers: {result.stderr}")
                return []
            
            containers = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    container_json = json.loads(line)
                    containers.append({
                        'id': container_json['ID'][:12],
                        'fullId': container_json['ID'],
                        'name': container_json['Names'],
                        'image': container_json['Image'],
                        'status': container_json['State'],
                        'state': container_json['Status'],
                        'created': container_json['CreatedAt'],
                        'ports': container_json.get('Ports', '')
                    })
            
            return containers
        except Exception as e:
            print(f"Error getting containers: {e}")
            return []

    def get_all_metrics_bulk(self, container_ids: List[str]) -> Dict[str, Dict]:
        """Get metrics for multiple containers in ONE docker stats call - MUCH FASTER!"""
        if not self.connected or not container_ids:
            return {}
        
        try:
            # Get all metrics in a single command - 10x faster!
            stats_cmd = ['docker', 'stats', '--no-stream', '--format', '{{json .}}'] + container_ids
            result = subprocess.run(stats_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                return {}
            
            metrics_map = {}
            for line in result.stdout.strip().split('\n'):
                if line:
                    stats = json.loads(line)
                    container_id = stats.get('Container', '')[:12]
                    
                    cpu_str = stats.get('CPUPerc', '0%').rstrip('%')
                    cpu = float(cpu_str) if cpu_str else 0
                    
                    mem_str = stats.get('MemPerc', '0%').rstrip('%')
                    memory = float(mem_str) if mem_str else 0
                    
                    metrics_map[container_id] = {
                        'containerId': container_id,
                        'running': True,
                        'cpu': round(min(cpu, 100), 2),
                        'memory': round(min(memory, 100), 2),
                        'memoryUsage': stats.get('MemUsage', 'N/A'),
                        'networkIO': stats.get('NetIO', '0B / 0B'),
                        'blockIO': stats.get('BlockIO', 'N/A'),
                        'timestamp': datetime.now().isoformat()
                    }
            
            return metrics_map
        except Exception as e:
            print(f"Error getting bulk metrics: {e}")
            return {}

    def get_container_metrics(self, container_id: str) -> Dict:
        """Get metrics for a single container - used for individual requests"""
        if not self.connected:
            return {'error': 'Docker not connected'}
        
        try:
            # Check if running
            inspect_cmd = ['docker', 'inspect', '--format', '{{.State.Running}}', container_id]
            result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=5)
            
            if result.returncode != 0 or result.stdout.strip() != 'true':
                return {
                    'containerId': container_id[:12],
                    'running': False,
                    'cpu': 0,
                    'memory': 0,
                    'error': 'Container is not running'
                }
            
            # Get metrics using bulk method (still fast for single container)
            metrics_map = self.get_all_metrics_bulk([container_id])
            return metrics_map.get(container_id[:12], {
                'containerId': container_id[:12],
                'running': False,
                'cpu': 0,
                'memory': 0,
                'error': 'Failed to get stats'
            })
        except Exception as e:
            print(f"Error getting metrics for {container_id}: {e}")
            return {
                'containerId': container_id[:12],
                'running': False,
                'cpu': 0,
                'memory': 0,
                'error': str(e)
            }

    def get_aggregated_metrics(self, user_id: Optional[str] = None) -> Dict:
        """OPTIMIZED: Get all containers and their metrics in bulk"""
        containers = self.get_student_containers(user_id)
        
        if not containers:
            return {
                'avgCpu': 0,
                'avgMemory': 0,
                'totalContainers': 0,
                'runningContainers': 0,
                'stoppedContainers': 0,
                'containers': []
            }
        
        running = [c for c in containers if c['status'] == 'running']
        
        # OPTIMIZATION: Get all metrics in ONE docker stats call instead of N calls!
        running_ids = [c['fullId'] for c in running]
        metrics_map = self.get_all_metrics_bulk(running_ids) if running_ids else {}
        
        # Calculate averages from the bulk metrics
        valid_metrics = [m for m in metrics_map.values() if m.get('running')]
        avg_cpu = sum(m['cpu'] for m in valid_metrics) / len(valid_metrics) if valid_metrics else 0
        avg_memory = sum(m['memory'] for m in valid_metrics) / len(valid_metrics) if valid_metrics else 0
        
        # Attach metrics to containers
        containers_with_metrics = []
        for container in containers:
            metric = metrics_map.get(container['id'], {'cpu': 0, 'memory': 0, 'running': False})
            containers_with_metrics.append({
                **container,
                'metrics': metric
            })
        
        return {
            'avgCpu': round(avg_cpu, 2),
            'avgMemory': round(avg_memory, 2),
            'totalContainers': len(containers),
            'runningContainers': len(running),
            'stoppedContainers': len(containers) - len(running),
            'containers': containers_with_metrics
        }

    def get_container_logs(self, container_id: str, tail: int = 100) -> str:
        if not self.connected:
            return "Docker not connected"
        
        try:
            cmd = ['docker', 'logs', '--tail', str(tail), '--timestamps', container_id]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return result.stdout if result.returncode == 0 else f"Error: {result.stderr}"
        except Exception as e:
            return f"Error: {str(e)}"

    def check_docker_status(self) -> Dict:
        if not self.connected:
            return {'running': False, 'error': 'Not connected'}
        
        try:
            result = subprocess.run(['docker', 'info', '--format', '{{json .}}'], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode != 0:
                return {'running': False, 'error': result.stderr}
            
            info = json.loads(result.stdout)
            return {
                'running': True,
                'containers': info.get('Containers', 0),
                'containersRunning': info.get('ContainersRunning', 0),
                'containersPaused': info.get('ContainersPaused', 0),
                'containersStopped': info.get('ContainersStopped', 0),
                'images': info.get('Images', 0),
                'serverVersion': info.get('ServerVersion', 'unknown')
            }
        except Exception as e:
            return {'running': False, 'error': str(e)}


docker_metrics_service = DockerMetricsService()
