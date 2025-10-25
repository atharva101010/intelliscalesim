from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from database.connection import Base

class CloudPricing(Base):
    """Store cloud provider pricing data"""
    __tablename__ = "cloud_pricing"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False, index=True)  # AWS, GCP, Azure
    region = Column(String, default="us-east-1")
    
    # Compute pricing (per hour)
    cpu_per_vcpu_hour = Column(Float, nullable=False)
    memory_per_gb_hour = Column(Float, nullable=False)
    
    # Storage pricing (per month)
    storage_per_gb_month = Column(Float, nullable=False)
    
    # Network pricing
    data_transfer_out_per_gb = Column(Float, default=0.09)
    data_transfer_in_per_gb = Column(Float, default=0.0)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "provider": self.provider,
            "region": self.region,
            "compute": {
                "cpu_per_vcpu_hour": self.cpu_per_vcpu_hour,
                "memory_per_gb_hour": self.memory_per_gb_hour
            },
            "storage": {
                "storage_per_gb_month": self.storage_per_gb_month
            },
            "network": {
                "data_transfer_out_per_gb": self.data_transfer_out_per_gb,
                "data_transfer_in_per_gb": self.data_transfer_in_per_gb
            },
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }
