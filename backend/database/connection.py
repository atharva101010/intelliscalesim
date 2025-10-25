from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from database.models import Base
import os

# Database file path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'intelliscalesim.db')
DATABASE_URL = f'sqlite:///{DB_PATH}'

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create scoped session for thread safety
db_session = scoped_session(SessionLocal)

def init_database():
    """Initialize database - create all tables"""
    print("🗄️  Initializing database...")
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database created at: {DB_PATH}")
    print("✅ All tables created successfully")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def close_database():
    """Close database connections"""
    db_session.remove()
    engine.dispose()
    print("✅ Database connections closed")
