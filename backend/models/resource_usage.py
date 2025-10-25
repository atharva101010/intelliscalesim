from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base

class ResourceUsage(Base):
    """Track resource usage for billing calculations"""
    __tablename__ = "resource_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), nullable=False, index=True)
    
    # Resource metrics
    cpu_cores_used = Column(Float, default=0.0)
    memory_gb_used = Column(Float, default=0.0)
    storage_gb_used = Column(Float, default=0.0)
    
    # Duration
    duration_minutes = Column(Integer, default=0)
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "deployment_id": self.deployment_id,
            "cpu_cores_used": self.cpu_cores_used,
            "memory_gb_used": self.memory_gb_used,
            "storage_gb_used": self.storage_gb_used,
            "duration_minutes": self.duration_minutes,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }
