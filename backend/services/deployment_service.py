import subprocess
import time
import tempfile
import shutil
import os
from typing import Dict, Optional
from datetime import datetime
from urllib.parse import urlparse
from database import db_session, Deployment, ContainerLog

class DeploymentService:
    def __init__(self):
        # Database will now handle persistence
        pass
        
    def find_available_port(self, start_port=8001, end_port=9000):
        """Find an available port in the specified range (skips 8000 for backend API)"""
        for port in range(start_port, end_port):
            try:
                result = subprocess.run(
                    ['docker', 'ps', '--format', '{{.Ports}}'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if f':{port}->' not in result.stdout:
                    return port
            except Exception as e:
                print(f"Error checking port {port}: {e}")
        return None
        
    def _save_deployment(self, container_id: str, container_name: str, image_name: str,
                        port: int, user_id: str, user_name: str, method: str):
        """Save deployment to database"""
        try:
            deployment = Deployment(
                container_id=container_id,
                container_name=container_name,
                image_name=image_name,
                port=port,
                user_id=user_id,
                user_name=user_name,
                status='running',
                deployment_method=method
            )
            db_session.add(deployment)
            db_session.commit()
            print(f"✅ Deployment saved to database: {container_name}")
            
            # Log the deployment action
            self._log_container_action(
                container_id, container_name, 'deployed', 
                user_id, user_name, f"Deployed via {method}"
            )
        except Exception as e:
            db_session.rollback()
            print(f"❌ Error saving deployment: {e}")
    
    def _log_container_action(self, container_id: str, container_name: str, 
                             action: str, user_id: str, user_name: str, details: str = None):
        """Log container action to database"""
        try:
            log = ContainerLog(
                container_id=container_id,
                container_name=container_name,
                action=action,
                user_id=user_id,
                user_name=user_name,
                details=details
            )
            db_session.add(log)
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            print(f"⚠️  Error logging action: {e}")
        
    def deploy_docker_image(self, image_name: str, container_name: str, 
                           port: Optional[int] = None, user_id: str = "student",
                           user_name: str = "Student", env_vars: dict = None,
                           credentials: Optional[Dict[str, str]] = None) -> Dict:
        """Deploy a Docker image from Docker Hub (supports private images with credentials)"""
        logged_in = False
        try:
            # Find available port if not specified
            if not port:
                port = self.find_available_port()
                if not port:
                    return {'success': False, 'message': 'No available ports'}
            
            # Check if container name already exists
            check_cmd = ['docker', 'ps', '-a', '--filter', f'name={container_name}', '--format', '{{.Names}}']
            result = subprocess.run(check_cmd, capture_output=True, text=True, timeout=5)
            if container_name in result.stdout:
                return {'success': False, 'message': f'Container name "{container_name}" already exists'}
            
            # Optional one-time docker login for private images
            if credentials and credentials.get('username') and credentials.get('password'):
                try:
                    print(f"🔐 Logging into Docker Hub for private image access...")
                    login_cmd = ['docker', 'login', '--username', credentials['username'], '--password-stdin']
                    proc = subprocess.Popen(
                        login_cmd, 
                        stdin=subprocess.PIPE, 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE, 
                        text=True
                    )
                    stdout, stderr = proc.communicate(input=credentials['password'], timeout=30)
                    
                    if proc.returncode != 0:
                        return {
                            'success': False, 
                            'message': f'Docker login failed: {stderr or stdout}'
                        }
                    logged_in = True
                    print(f"✅ Docker login successful")
                except Exception as e:
                    return {
                        'success': False, 
                        'message': f'Docker login error: {str(e)}'
                    }
            
            # Pull the image
            print(f"📥 Pulling image: {image_name}")
            pull_cmd = ['docker', 'pull', image_name]
            pull_result = subprocess.run(pull_cmd, capture_output=True, text=True, timeout=300)
            
            if pull_result.returncode != 0:
                if logged_in:
                    try:
                        subprocess.run(['docker', 'logout'], capture_output=True, text=True, timeout=15)
                    except Exception:
                        pass
                
                return {
                    'success': False,
                    'message': f'Failed to pull image: {pull_result.stderr}'
                }
            
            # Prepare docker run command
            run_cmd = [
                'docker', 'run', '-d',
                '--name', container_name,
                '--label', 'deployed_by=student',
                '--label', f'user_id={user_id}',
                '--label', f'user_name={user_name}',
                '--label', f'deployed_at={datetime.now().isoformat()}',
                '--label', 'deployment_method=ui',
                '--restart', 'unless-stopped',
                '-p', f'{port}:80',
            ]
            
            # Add environment variables if provided
            if env_vars:
                for key, value in env_vars.items():
                    run_cmd.extend(['-e', f'{key}={value}'])
            
            run_cmd.append(image_name)
            
            # Run the container
            print(f"🚀 Starting container: {container_name}")
            run_result = subprocess.run(run_cmd, capture_output=True, text=True, timeout=30)
            
            # Logout immediately after deployment
            if logged_in:
                try:
                    print(f"🔒 Logging out of Docker Hub...")
                    subprocess.run(['docker', 'logout'], capture_output=True, text=True, timeout=15)
                    print(f"✅ Docker logout successful")
                except Exception as e:
                    print(f"⚠️  Docker logout warning: {e}")
            
            if run_result.returncode != 0:
                return {
                    'success': False,
                    'message': f'Failed to start container: {run_result.stderr}'
                }
            
            container_id = run_result.stdout.strip()
            
            # Save deployment to database
            self._save_deployment(
                container_id=container_id,
                container_name=container_name,
                image_name=image_name,
                port=port,
                user_id=user_id,
                user_name=user_name,
                method='docker_hub'
            )
            
            return {
                'success': True,
                'message': 'Container deployed successfully',
                'data': {
                    'containerId': container_id[:12],
                    'containerName': container_name,
                    'image': image_name,
                    'port': port,
                    'url': f'http://localhost:{port}'
                }
            }
            
        except subprocess.TimeoutExpired:
            if logged_in:
                try:
                    subprocess.run(['docker', 'logout'], capture_output=True, text=True, timeout=15)
                except Exception:
                    pass
            return {'success': False, 'message': 'Deployment timed out'}
        except Exception as e:
            if logged_in:
                try:
                    subprocess.run(['docker', 'logout'], capture_output=True, text=True, timeout=15)
                except Exception:
                    pass
            return {'success': False, 'message': f'Deployment failed: {str(e)}'}
    
    def deploy_from_github(self, repo_url: str, container_name: str,
                          port: Optional[int] = None, user_id: str = "student",
                          user_name: str = "Student", dockerfile_path: str = "Dockerfile",
                          credentials: Optional[Dict[str, str]] = None) -> Dict:
        """Deploy from GitHub repository (supports private repos with credentials)"""
        tmpdir = None
        try:
            # Find available port if not specified
            if not port:
                port = self.find_available_port()
                if not port:
                    return {'success': False, 'message': 'No available ports'}
            
            # Check if container name already exists
            check_cmd = ['docker', 'ps', '-a', '--filter', f'name={container_name}', '--format', '{{.Names}}']
            result = subprocess.run(check_cmd, capture_output=True, text=True, timeout=5)
            if container_name in result.stdout:
                return {'success': False, 'message': f'Container name "{container_name}" already exists'}
            
            # Generate image name
            image_name = f'student-app-{container_name}:latest'
            
            print(f"🔨 Building image from GitHub: {repo_url}")
            
            # Create temporary directory for cloning
            tmpdir = tempfile.mkdtemp(prefix='intelliscale_deploy_')
            print(f"📁 Created temp directory: {tmpdir}")
            
            # Prepare git clone command (with credentials if provided)
            if credentials and credentials.get('username') and credentials.get('token'):
                print(f"🔐 Cloning private repository with credentials...")
                parsed = urlparse(repo_url)
                auth_url = f"{parsed.scheme}://{credentials['username']}:{credentials['token']}@{parsed.netloc}{parsed.path}"
                clone_cmd = ['git', 'clone', '--depth', '1', auth_url, tmpdir]
            else:
                print(f"📦 Cloning public repository...")
                clone_cmd = ['git', 'clone', '--depth', '1', repo_url, tmpdir]
            
            # Clone repository
            clone_result = subprocess.run(
                clone_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            
            if clone_result.returncode != 0:
                if tmpdir:
                    shutil.rmtree(tmpdir, ignore_errors=True)
                return {
                    'success': False,
                    'message': f'Git clone failed: {clone_result.stderr or clone_result.stdout}'
                }
            
            print(f"✅ Repository cloned successfully")
            
            # Build from local directory
            dockerfile_full_path = os.path.join(tmpdir, dockerfile_path)
            
            if not os.path.exists(dockerfile_full_path):
                shutil.rmtree(tmpdir, ignore_errors=True)
                return {
                    'success': False,
                    'message': f'Dockerfile not found at: {dockerfile_path}'
                }
            
            print(f"🏗️  Building Docker image...")
            build_cmd = [
                'docker', 'build',
                '-t', image_name,
                '-f', dockerfile_full_path,
                tmpdir
            ]
            
            build_result = subprocess.run(
                build_cmd, 
                capture_output=True, 
                text=True, 
                timeout=1200
            )
            
            # Cleanup temp directory immediately after build
            print(f"🧹 Cleaning up temporary files...")
            try:
                shutil.rmtree(tmpdir, ignore_errors=True)
                tmpdir = None
            except Exception as e:
                print(f"⚠️  Cleanup warning: {e}")
            
            if build_result.returncode != 0:
                return {
                    'success': False,
                    'message': f'Failed to build image: {build_result.stderr}'
                }
            
            print(f"✅ Image built successfully: {image_name}")
            
            # Deploy the built image (without credentials since it's now local)
            return self.deploy_docker_image(
                image_name=image_name,
                container_name=container_name,
                port=port,
                user_id=user_id,
                user_name=user_name
            )
            
        except subprocess.TimeoutExpired:
            if tmpdir:
                shutil.rmtree(tmpdir, ignore_errors=True)
            return {'success': False, 'message': 'Build timed out'}
        except Exception as e:
            if tmpdir:
                shutil.rmtree(tmpdir, ignore_errors=True)
            return {'success': False, 'message': f'Deployment failed: {str(e)}'}
    
    def stop_container(self, container_id: str) -> Dict:
        """Stop a running container"""
        try:
            result = subprocess.run(
                ['docker', 'stop', container_id],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Update database
                deployment = db_session.query(Deployment).filter(
                    Deployment.container_id.like(f'{container_id}%')
                ).first()
                if deployment:
                    deployment.status = 'stopped'
                    db_session.commit()
                    
                    # Log action
                    self._log_container_action(
                        container_id, deployment.container_name, 
                        'stopped', deployment.user_id, deployment.user_name
                    )
                
                return {
                    'success': True,
                    'message': 'Container stopped successfully'
                }
            else:
                return {
                    'success': False,
                    'message': f'Failed to stop container: {result.stderr}'
                }
        except Exception as e:
            return {'success': False, 'message': f'Error stopping container: {str(e)}'}
    
    def start_container(self, container_id: str) -> Dict:
        """Start a stopped container"""
        try:
            result = subprocess.run(
                ['docker', 'start', container_id],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Update database
                deployment = db_session.query(Deployment).filter(
                    Deployment.container_id.like(f'{container_id}%')
                ).first()
                if deployment:
                    deployment.status = 'running'
                    db_session.commit()
                    
                    # Log action
                    self._log_container_action(
                        container_id, deployment.container_name, 
                        'started', deployment.user_id, deployment.user_name
                    )
                
                return {
                    'success': True,
                    'message': 'Container started successfully'
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr or 'Failed to start container'
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def remove_container(self, container_id: str, force: bool = False) -> Dict:
        """Remove a container"""
        try:
            cmd = ['docker', 'rm']
            if force:
                cmd.append('-f')
            cmd.append(container_id)
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Update database
                deployment = db_session.query(Deployment).filter(
                    Deployment.container_id.like(f'{container_id}%')
                ).first()
                if deployment:
                    user_id = deployment.user_id
                    user_name = deployment.user_name
                    container_name = deployment.container_name
                    
                    # Log action before deleting
                    self._log_container_action(
                        container_id, container_name, 
                        'removed', user_id, user_name
                    )
                    
                    # Remove from database
                    db_session.delete(deployment)
                    db_session.commit()
                
                return {
                    'success': True,
                    'message': 'Container removed successfully'
                }
            else:
                return {
                    'success': False,
                    'message': f'Failed to remove container: {result.stderr}'
                }
        except Exception as e:
            db_session.rollback()
            return {'success': False, 'message': f'Error removing container: {str(e)}'}
    
    def get_deployment_history(self, limit: int = 50) -> Dict:
        """Get deployment history from database"""
        try:
            deployments = db_session.query(Deployment)\
                .order_by(Deployment.created_at.desc())\
                .limit(limit)\
                .all()
            
            return {
                'success': True,
                'data': [d.to_dict() for d in deployments]
            }
        except Exception as e:
            return {'success': False, 'message': f'Error fetching history: {str(e)}'}
    
    def get_available_port(self) -> Dict:
        """Get next available port"""
        try:
            port = self.find_available_port()
            if port:
                return {
                    'success': True,
                    'data': {'port': port}
                }
            else:
                return {
                    'success': False,
                    'message': 'No available ports found'
                }
        except Exception as e:
            return {'success': False, 'message': f'Error finding port: {str(e)}'}

# Create singleton instance
deployment_service = DeploymentService()
