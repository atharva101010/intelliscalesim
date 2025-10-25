from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.cloud_pricing import CloudPricing
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ==========================================
# Pydantic Models for Request/Response
# ==========================================
class BillingCalculationRequest(BaseModel):
    provider: str  # AWS, GCP, or Azure
    cpu_cores: float
    memory_gb: float
    storage_gb: float
    duration_hours: float
    data_transfer_out_gb: Optional[float] = 0.0

class BillingCalculationResponse(BaseModel):
    provider: str
    cpu_cost: float
    memory_cost: float
    storage_cost: float
    network_cost: float
    total_cost: float
    breakdown: dict

# ==========================================
# GET /api/billing/pricing - Get all pricing
# ==========================================
@router.get("/pricing")
def get_all_pricing(db: Session = Depends(get_db)):
    """Get pricing data for all cloud providers"""
    try:
        pricing_data = db.query(CloudPricing).filter(CloudPricing.is_active == True).all()
        
        if not pricing_data:
            raise HTTPException(status_code=404, detail="No pricing data found")
        
        return {
            "success": True,
            "data": [p.to_dict() for p in pricing_data]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# GET /api/billing/pricing/{provider} - Get specific provider pricing
# ==========================================
@router.get("/pricing/{provider}")
def get_provider_pricing(provider: str, db: Session = Depends(get_db)):
    """Get pricing data for a specific cloud provider"""
    try:
        pricing = db.query(CloudPricing).filter(
            CloudPricing.provider == provider.upper(),
            CloudPricing.is_active == True
        ).first()
        
        if not pricing:
            raise HTTPException(status_code=404, detail=f"Pricing for {provider} not found")
        
        return {
            "success": True,
            "data": pricing.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# POST /api/billing/calculate - Calculate billing
# ==========================================
@router.post("/calculate", response_model=BillingCalculationResponse)
def calculate_billing(request: BillingCalculationRequest, db: Session = Depends(get_db)):
    """Calculate billing based on resource usage and real cloud pricing"""
    try:
        # Get pricing for the provider
        pricing = db.query(CloudPricing).filter(
            CloudPricing.provider == request.provider.upper(),
            CloudPricing.is_active == True
        ).first()
        
        if not pricing:
            raise HTTPException(status_code=404, detail=f"Pricing for {request.provider} not found")
        
        # Calculate costs
        cpu_cost = request.cpu_cores * pricing.cpu_per_vcpu_hour * request.duration_hours
        memory_cost = request.memory_gb * pricing.memory_per_gb_hour * request.duration_hours
        
        # Storage is billed monthly, so convert hours to months
        storage_cost = request.storage_gb * pricing.storage_per_gb_month * (request.duration_hours / 730)
        
        # Network cost (data transfer out)
        network_cost = request.data_transfer_out_gb * pricing.data_transfer_out_per_gb
        
        total_cost = cpu_cost + memory_cost + storage_cost + network_cost
        
        return BillingCalculationResponse(
            provider=request.provider.upper(),
            cpu_cost=round(cpu_cost, 4),
            memory_cost=round(memory_cost, 4),
            storage_cost=round(storage_cost, 4),
            network_cost=round(network_cost, 4),
            total_cost=round(total_cost, 4),
            breakdown={
                "cpu": {
                    "cores": request.cpu_cores,
                    "price_per_vcpu_hour": pricing.cpu_per_vcpu_hour,
                    "duration_hours": request.duration_hours,
                    "cost": round(cpu_cost, 4)
                },
                "memory": {
                    "gb": request.memory_gb,
                    "price_per_gb_hour": pricing.memory_per_gb_hour,
                    "duration_hours": request.duration_hours,
                    "cost": round(memory_cost, 4)
                },
                "storage": {
                    "gb": request.storage_gb,
                    "price_per_gb_month": pricing.storage_per_gb_month,
                    "duration_hours": request.duration_hours,
                    "cost": round(storage_cost, 4)
                },
                "network": {
                    "data_transfer_out_gb": request.data_transfer_out_gb,
                    "price_per_gb": pricing.data_transfer_out_per_gb,
                    "cost": round(network_cost, 4)
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# ==========================================
# POST /api/billing/compare - Compare pricing across providers
# ==========================================
@router.post("/compare")
def compare_providers(request: BillingCalculationRequest, db: Session = Depends(get_db)):
    """Compare costs across all cloud providers"""
    try:
        all_pricing = db.query(CloudPricing).filter(CloudPricing.is_active == True).all()
        
        results = []
        for pricing in all_pricing:
            cpu_cost = request.cpu_cores * pricing.cpu_per_vcpu_hour * request.duration_hours
            memory_cost = request.memory_gb * pricing.memory_per_gb_hour * request.duration_hours
            storage_cost = request.storage_gb * pricing.storage_per_gb_month * (request.duration_hours / 730)
            network_cost = request.data_transfer_out_gb * pricing.data_transfer_out_per_gb
            total_cost = cpu_cost + memory_cost + storage_cost + network_cost
            
            results.append({
                "provider": pricing.provider,
                "total_cost": round(total_cost, 4),
                "cpu_cost": round(cpu_cost, 4),
                "memory_cost": round(memory_cost, 4),
                "storage_cost": round(storage_cost, 4),
                "network_cost": round(network_cost, 4)
            })
        
        # Sort by total cost
        results.sort(key=lambda x: x["total_cost"])
        
        return {
            "success": True,
            "comparison": results,
            "cheapest": results[0]["provider"] if results else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# Real-Time Container Billing Endpoints
# ==========================================

from models.container_billing import ContainerBilling
from datetime import datetime

@router.post("/containers/start")
def start_container_billing(
    container_id: str,
    container_name: str,
    cpu_cores: float,
    memory_mb: float,
    provider: str = "AWS",
    db: Session = Depends(get_db)
):
    """Start billing tracking for a running container"""
    try:
        # Create new billing record
        billing = ContainerBilling(
            container_id=container_id,
            container_name=container_name,
            user_id=1,  # TODO: Get from authenticated user
            cpu_cores=cpu_cores,
            memory_mb=memory_mb / 1024,  # Convert MB to GB
            provider=provider.upper(),
            start_time=datetime.utcnow()
        )
        
        db.add(billing)
        db.commit()
        db.refresh(billing)
        
        return {
            "message": "Billing started",
            "billing_id": billing.id,
            "container_id": container_id,
            "start_time": billing.start_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/containers/update")
def update_container_billing(
    container_id: str,
    duration_seconds: int,
    db: Session = Depends(get_db)
):
    """Update billing for a running container"""
    try:
        # Get active billing record
        billing = db.query(ContainerBilling).filter(
            ContainerBilling.container_id == container_id,
            ContainerBilling.end_time == None
        ).first()
        
        if not billing:
            raise HTTPException(status_code=404, detail="No active billing session found")
        
        # Get pricing
        pricing = db.query(CloudPricing).filter(
            CloudPricing.provider == billing.provider,
            CloudPricing.is_active == True
        ).first()
        
        if not pricing:
            raise HTTPException(status_code=404, detail=f"Pricing for {billing.provider} not found")
        
        # Calculate costs (convert seconds to hours)
        hours = duration_seconds / 3600
        billing.duration_seconds = duration_seconds
        billing.cpu_cost = billing.cpu_cores * pricing.cpu_per_vcpu_hour * hours
        billing.memory_cost = billing.memory_mb * pricing.memory_per_gb_hour * hours
        billing.storage_cost = 0.0  # Fixed storage for containers
        billing.network_cost = 0.0  # TODO: Track network if needed
        billing.total_cost = billing.cpu_cost + billing.memory_cost + billing.storage_cost + billing.network_cost
        billing.last_updated = datetime.utcnow()
        
        db.commit()
        db.refresh(billing)
        
        return {
            "billing_id": billing.id,
            "container_id": container_id,
            "duration_seconds": duration_seconds,
            "total_cost": round(billing.total_cost, 4),
            "breakdown": {
                "cpu_cost": round(billing.cpu_cost, 4),
                "memory_cost": round(billing.memory_cost, 4),
                "storage_cost": round(billing.storage_cost, 4),
                "network_cost": round(billing.network_cost, 4)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/containers/stop")
def stop_container_billing(
    container_id: str,
    db: Session = Depends(get_db)
):
    """Stop billing for a container"""
    try:
        # Get active billing record
        billing = db.query(ContainerBilling).filter(
            ContainerBilling.container_id == container_id,
            ContainerBilling.end_time == None
        ).first()
        
        if not billing:
            raise HTTPException(status_code=404, detail="No active billing session found")
        
        billing.end_time = datetime.utcnow()
        db.commit()
        
        return {
            "message": "Billing stopped",
            "billing_id": billing.id,
            "container_id": container_id,
            "total_cost": round(billing.total_cost, 4),
            "duration_seconds": billing.duration_seconds
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/containers/active")
def get_active_billings(db: Session = Depends(get_db)):
    """Get all containers with active billing"""
    try:
        active_billings = db.query(ContainerBilling).filter(
            ContainerBilling.end_time == None
        ).all()
        
        result = []
        for billing in active_billings:
            result.append({
                "billing_id": billing.id,
                "container_id": billing.container_id,
                "container_name": billing.container_name,
                "provider": billing.provider,
                "cpu_cores": billing.cpu_cores,
                "memory_gb": billing.memory_mb,
                "total_cost": round(billing.total_cost, 4),
                "duration_seconds": billing.duration_seconds,
                "start_time": billing.start_time.isoformat() if billing.start_time else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_billing_history(db: Session = Depends(get_db)):
    """Get billing history (completed sessions)"""
    try:
        history = db.query(ContainerBilling).filter(
            ContainerBilling.end_time != None
        ).order_by(ContainerBilling.end_time.desc()).limit(50).all()
        
        result = []
        for billing in history:
            result.append({
                "billing_id": billing.id,
                "container_id": billing.container_id,
                "container_name": billing.container_name,
                "provider": billing.provider,
                "total_cost": round(billing.total_cost, 4),
                "duration_seconds": billing.duration_seconds,
                "start_time": billing.start_time.isoformat() if billing.start_time else None,
                "end_time": billing.end_time.isoformat() if billing.end_time else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
