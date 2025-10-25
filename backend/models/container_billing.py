from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class ContainerBilling(Base):
    __tablename__ = "container_billing"
    
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, index=True)
    container_name = Column(String)
    user_id = Column(Integer)  # Removed ForeignKey constraint
    
    # Resource usage
    cpu_cores = Column(Float)
    memory_mb = Column(Float)
    
    # Provider and pricing
    provider = Column(String, default="AWS")
    
    # Cost breakdown
    cpu_cost = Column(Float, default=0.0)
    memory_cost = Column(Float, default=0.0)
    storage_cost = Column(Float, default=0.0)
    network_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Time tracking
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Duration in seconds
    duration_seconds = Column(Integer, default=0)
