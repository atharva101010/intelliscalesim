from database.connection import Base, engine, SessionLocal, get_db
from models.user import User
from models.load_test import LoadTest
from models.cloud_pricing import CloudPricing
from models.container_billing import ContainerBilling
from models.resource_usage import ResourceUsage

# Legacy exports for backward compatibility (if they exist)
try:
    from database.models import Deployment, ContainerLog
    has_legacy_models = True
except:
    has_legacy_models = False

# Create db_session alias for legacy code
db_session = SessionLocal

# Legacy database initialization functions (for old code compatibility)
def init_database():
    """Legacy function - initializes database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized!")

def close_database():
    """Legacy function - closes database connection"""
    pass  # SessionLocal handles this automatically

# Standard init function
def init_db():
    """Creates all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

# Export everything (including legacy functions)
__all__ = [
    "Base",
    "engine", 
    "SessionLocal",
    "get_db",
    "init_db",
    "init_database",      # Legacy
    "close_database",     # Legacy
    "db_session",         # Legacy
    "User",
    "LoadTest",
    "CloudPricing",
    "ResourceUsage",
    "ContainerBilling",
]

# Add legacy models if they exist
if has_legacy_models:
    __all__.extend(["Deployment", "ContainerLog"])
