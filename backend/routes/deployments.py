from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import docker
import os
import subprocess
import tempfile
import shutil
from datetime import datetime

deployments_bp = Blueprint('deployments', __name__)
client = docker.from_env()

@deployments_bp.route('/docker-deploy', methods=['POST'])
@jwt_required()
def deploy_docker_image():
    """Deploy a Docker image from Docker Hub"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        image_name = data.get('image_name')
        container_name = data.get('container_name', f"app-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        port = data.get('port', 8080)
        username = data.get('username')
        password = data.get('password')
        
        if not image_name:
            return jsonify({'error': 'Image name is required'}), 400
        
        # Login to Docker Hub if credentials provided
        if username and password:
            try:
                client.login(username=username, password=password)
            except docker.errors.APIError as e:
                return jsonify({'error': f'Docker Hub authentication failed: {str(e)}'}), 401
        
        # Pull the image
        try:
            print(f"Pulling image: {image_name}")
            client.images.pull(image_name)
        except docker.errors.ImageNotFound:
            return jsonify({'error': f'Image {image_name} not found'}), 404
        except docker.errors.APIError as e:
            return jsonify({'error': f'Failed to pull image: {str(e)}'}), 500
        
        # Run the container
        try:
            container = client.containers.run(
                image_name,
                name=container_name,
                ports={f'{port}/tcp': port},
                detach=True,
                labels={'user': current_user, 'deployed_by': 'intelliscalesim'}
            )
            
            return jsonify({
                'success': True,
                'message': 'Deployment successful',
                'container_id': container.id,
                'container_name': container_name,
                'access_url': f'http://localhost:{port}',
                'image': image_name,
                'port': port
            }), 200
            
        except docker.errors.APIError as e:
            return jsonify({'error': f'Failed to start container: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@deployments_bp.route('/github-deploy', methods=['POST'])
@jwt_required()
def deploy_github():
    """Build and deploy from GitHub repository"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        repo_url = data.get('repo_url')
        branch = data.get('branch', 'main')
        container_name = data.get('container_name', f"github-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        port = data.get('port', 8080)
        username = data.get('username')
        access_token = data.get('access_token')
        
        if not repo_url:
            return jsonify({'error': 'Repository URL is required'}), 400
        
        # Create temporary directory for cloning
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Modify repo URL for private repos
            if username and access_token:
                if 'github.com/' in repo_url:
                    repo_url = repo_url.replace('https://github.com/', 
                                               f'https://{username}:{access_token}@github.com/')
            
            # Clone repository
            print(f"Cloning repository: {repo_url}")
            subprocess.run(
                ['git', 'clone', '--branch', branch, '--depth', '1', repo_url, temp_dir],
                check=True,
                capture_output=True,
                text=True
            )
            
            # Check if Dockerfile exists
            dockerfile_path = os.path.join(temp_dir, 'Dockerfile')
            if not os.path.exists(dockerfile_path):
                return jsonify({'error': 'Dockerfile not found in repository root'}), 400
            
            # Build Docker image
            image_tag = f"{container_name}:latest"
            print(f"Building image: {image_tag}")
            
            image, build_logs = client.images.build(
                path=temp_dir,
                tag=image_tag,
                rm=True,
                labels={'user': current_user, 'source': 'github', 'deployed_by': 'intelliscalesim'}
            )
            
            # Run container
            container = client.containers.run(
                image_tag,
                name=container_name,
                ports={f'{port}/tcp': port},
                detach=True,
                labels={'user': current_user, 'deployed_by': 'intelliscalesim', 'source': 'github'}
            )
            
            return jsonify({
                'success': True,
                'message': 'GitHub deployment successful',
                'container_id': container.id,
                'container_name': container_name,
                'access_url': f'http://localhost:{port}',
                'image': image_tag,
                'port': port,
                'repository': repo_url,
                'branch': branch
            }), 200
            
        except subprocess.CalledProcessError as e:
            return jsonify({'error': f'Git clone failed: {e.stderr}'}), 500
        except docker.errors.BuildError as e:
            return jsonify({'error': f'Docker build failed: {str(e)}'}), 500
        except docker.errors.APIError as e:
            return jsonify({'error': f'Container start failed: {str(e)}'}), 500
        finally:
            # Clean up temporary directory
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500
