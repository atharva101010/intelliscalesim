import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import init_db, SessionLocal
from models.cloud_pricing import CloudPricing
import json

def seed_pricing_data():
    """Load pricing data from JSON files into database"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing = db.query(CloudPricing).count()
        if existing > 0:
            print(f"⚠️  Pricing data already exists ({existing} records). Skipping seed...")
            return
        
        pricing_files = {
            "AWS": "data/pricing/aws_pricing.json",
            "GCP": "data/pricing/gcp_pricing.json",
            "Azure": "data/pricing/azure_pricing.json"
        }
        
        for provider, filepath in pricing_files.items():
            print(f"📥 Loading {provider} pricing data...")
            
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            pricing = CloudPricing(
                provider=data["provider"],
                region=data["region"],
                cpu_per_vcpu_hour=data["compute"]["cpu_per_vcpu_hour"],
                memory_per_gb_hour=data["compute"]["memory_per_gb_hour"],
                storage_per_gb_month=data["storage"]["storage_per_gb_month"],
                data_transfer_out_per_gb=data["network"]["data_transfer_out_per_gb"],
                data_transfer_in_per_gb=data["network"]["data_transfer_in_per_gb"],
                is_active=True
            )
            
            db.add(pricing)
            print(f"✅ Added {provider} pricing")
        
        db.commit()
        print("\n🎉 Pricing data seeded successfully!")
        
        # Verify
        count = db.query(CloudPricing).count()
        print(f"📊 Total pricing records: {count}")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Initializing billing database...\n")
    init_db()
    print("\n📦 Seeding pricing data...\n")
    seed_pricing_data()
