from models.user import User
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Simulation(Base):
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    
    # Configuration
    image = Column(String)  # Docker image name
    cpu_limit = Column(Float, default=1.0)  # CPU cores
    memory_limit = Column(String, default="512m")  # Memory limit
    replicas = Column(Integer, default=1)  # Number of instances
    
    # Status
    status = Column(String, default="pending")  # pending, running, stopped, failed, completed
    container_ids = Column(JSON, default=[])  # List of Docker container IDs
    
    # Assignment
    teacher_id = Column(Integer, ForeignKey("users.id"))
    assigned_students = Column(JSON, default=[])  # List of student IDs
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
#    teacher = relationship("User", back_populates="simulations")
    
    # Metadata
    metadata_json = Column(JSON, default={})  # Custom metadata


#class User(Base):
#    __tablename__ = "users"
#    
#    id = Column(Integer, primary_key=True, index=True)
#    username = Column(String, unique=True, index=True)
#    email = Column(String, unique=True, index=True)
#    role = Column(String)  # teacher, student, admin
#    hashed_password = Column(String)
#    created_at = Column(DateTime, default=datetime.utcnow)
#    
#    # Relationships
#    simulations = relationship("Simulation")
