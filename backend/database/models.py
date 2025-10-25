from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Deployment(Base):
    """Stores all deployment records"""
    __tablename__ = 'deployments'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    container_id = Column(String(64), unique=True, nullable=False)
    container_name = Column(String(255), nullable=False)
    image_name = Column(String(255), nullable=False)
    port = Column(Integer)
    user_id = Column(String(100), nullable=False)
    user_name = Column(String(255), nullable=False)
    status = Column(String(50), default='running')
    deployment_method = Column(String(50))  # 'docker_hub' or 'github'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'containerId': self.container_id[:12] if self.container_id else None,
            'containerName': self.container_name,
            'image': self.image_name,
            'port': self.port,
            'userId': self.user_id,
            'userName': self.user_name,
            'status': self.status,
            'method': self.deployment_method,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }

class ContainerLog(Base):
    """Stores container activity logs"""
    __tablename__ = 'container_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    container_id = Column(String(64), nullable=False)
    container_name = Column(String(255), nullable=False)
    action = Column(String(50), nullable=False)  # 'deployed', 'stopped', 'removed', 'restarted'
    user_id = Column(String(100), nullable=False)
    user_name = Column(String(255))
    details = Column(Text)  # JSON string for additional details
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'containerId': self.container_id[:12] if self.container_id else None,
            'containerName': self.container_name,
            'action': self.action,
            'userId': self.user_id,
            'userName': self.user_name,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class AutoScalingRule(Base):
    """Stores auto-scaling configurations"""
    __tablename__ = 'autoscaling_rules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    container_name = Column(String(255), nullable=False)
    user_id = Column(String(100), nullable=False)
    min_replicas = Column(Integer, default=1)
    max_replicas = Column(Integer, default=5)
    cpu_threshold = Column(Float, default=80.0)
    memory_threshold = Column(Float, default=80.0)
    cpu_scale_down = Column(Float, nullable=True)
    memory_scale_down = Column(Float, nullable=True)
    check_interval = Column(Integer, nullable=True)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'containerName': self.container_name,
            'userId': self.user_id,
            'minReplicas': self.min_replicas,
            'maxReplicas': self.max_replicas,
            'cpuThreshold': self.cpu_threshold,
            'memoryThreshold': self.memory_threshold,
            'enabled': self.enabled,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class SystemStats(Base):
    """Stores system-wide statistics"""
    __tablename__ = 'system_stats'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    total_deployments = Column(Integer, default=0)
    active_containers = Column(Integer, default=0)
    total_users = Column(Integer, default=0)
    most_deployed_image = Column(String(255))
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'totalDeployments': self.total_deployments,
            'activeContainers': self.active_containers,
            'totalUsers': self.total_users,
            'mostDeployedImage': self.most_deployed_image,
            'lastUpdated': self.last_updated.isoformat() if self.last_updated else None
        }
