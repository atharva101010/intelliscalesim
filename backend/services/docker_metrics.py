import docker
from datetime import datetime
from typing import List, Dict, Optional
import os

class DockerMetricsService:
    def __init__(self):
        try:
            # Try to connect using Unix socket directly
            self.client = docker.DockerClient(base_url='unix://var/run/docker.sock')
            self.client.ping()
            print("✅ Connected to Docker daemon via Unix socket")
        except Exception as e:
            print(f"❌ Failed to connect to Docker: {e}")
            print("Trying alternative connection method...")
            try:
                # Alternative: Try using environment variables
                self.client = docker.from_env()
                self.client.ping()
                print("✅ Connected to Docker daemon via environment")
            except Exception as e2:
                print(f"❌ Both connection methods failed: {e2}")
                self.client = None

    def get_student_containers(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get all student-deployed containers"""
        if not self.client:
            return []
        
        try:
            filters = {'label': 'deployed_by=student'}
            if user_id:
                filters['label'] = [f'deployed_by=student', f'user_id={user_id}']
            
            containers = self.client.containers.list(all=True, filters=filters)
            
            result = []
            for container in containers:
                result.append({
                    'id': container.short_id,
                    'name': container.name,
                    'image': container.image.tags[0] if container.image.tags else 'unknown',
                    'status': container.status,
                    'created': container.attrs['Created'],
                    'labels': container.labels,
                    'ports': container.ports
                })
            
            return result
        except Exception as e:
            print(f"Error getting containers: {e}")
            return []

    def get_container_metrics(self, container_id: str) -> Dict:
        """Get real-time metrics for a specific container"""
        if not self.client:
            return {'error': 'Docker not connected'}
        
        try:
            container = self.client.containers.get(container_id)
            
            if container.status != 'running':
                return {
                    'containerId': container_id,
                    'running': False,
                    'cpu': 0,
                    'memory': 0,
                    'error': 'Container is not running'
                }
            
            # Get stats (one-shot)
            stats = container.stats(stream=False)
            
            # Calculate CPU percentage
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                       stats['precpu_stats']['cpu_usage']['total_usage']
            system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                          stats['precpu_stats']['system_cpu_usage']
            cpu_count = stats['cpu_stats']['online_cpus']
            
            cpu_percent = 0
            if system_delta > 0 and cpu_delta > 0:
                cpu_percent = (cpu_delta / system_delta) * cpu_count * 100
            
            # Calculate Memory percentage
            memory_usage = stats['memory_stats'].get('usage', 0)
            memory_limit = stats['memory_stats'].get('limit', 1)
            memory_percent = (memory_usage / memory_limit) * 100
            
            # Network stats
            networks = stats.get('networks', {})
            network_rx = sum(net.get('rx_bytes', 0) for net in networks.values())
            network_tx = sum(net.get('tx_bytes', 0) for net in networks.values())
            
            return {
                'containerId': container_id[:12],
                'running': True,
                'cpu': round(min(cpu_percent, 100), 2),
                'memory': round(min(memory_percent, 100), 2),
                'memoryUsage': self.format_bytes(memory_usage),
                'memoryLimit': self.format_bytes(memory_limit),
                'networkRx': self.format_bytes(network_rx),
                'networkTx': self.format_bytes(network_tx),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting metrics for {container_id}: {e}")
            return {
                'containerId': container_id,
                'running': False,
                'cpu': 0,
                'memory': 0,
                'error': str(e)
            }

    def get_aggregated_metrics(self, user_id: Optional[str] = None) -> Dict:
        """Get aggregated metrics for all student containers"""
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
        metrics_list = [self.get_container_metrics(c['id']) for c in running]
        valid_metrics = [m for m in metrics_list if m.get('running')]
        
        avg_cpu = sum(m['cpu'] for m in valid_metrics) / len(valid_metrics) if valid_metrics else 0
        avg_memory = sum(m['memory'] for m in valid_metrics) / len(valid_metrics) if valid_metrics else 0
        
        containers_with_metrics = []
        for container in containers:
            metric = next((m for m in metrics_list if m['containerId'] == container['id']), None)
            containers_with_metrics.append({
                **container,
                'metrics': metric or {'cpu': 0, 'memory': 0, 'running': False}
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
        """Get container logs"""
        if not self.client:
            return "Docker not connected"
        
        try:
            container = self.client.containers.get(container_id)
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode('utf-8')
        except Exception as e:
            return f"Error: {str(e)}"

    @staticmethod
    def format_bytes(bytes_val: int) -> str:
        """Format bytes to human readable"""
        if bytes_val == 0:
            return "0 B"
        
        sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        k = 1024
        i = 0
        while bytes_val >= k and i < len(sizes) - 1:
            bytes_val /= k
            i += 1
        
        return f"{round(bytes_val, 2)} {sizes[i]}"

    def check_docker_status(self) -> Dict:
        """Check Docker daemon status"""
        if not self.client:
            return {'running': False, 'error': 'Not connected'}
        
        try:
            info = self.client.info()
            return {
                'running': True,
                'containers': info['Containers'],
                'containersRunning': info['ContainersRunning'],
                'containersPaused': info['ContainersPaused'],
                'containersStopped': info['ContainersStopped'],
                'images': info['Images'],
                'serverVersion': info['ServerVersion']
            }
        except Exception as e:
            return {'running': False, 'error': str(e)}


# Create singleton instance
docker_metrics_service = DockerMetricsService()
