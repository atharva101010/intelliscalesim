from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from database import Base

class LoadTest(Base):
    __tablename__ = "load_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    target_url = Column(String, nullable=False)
    total_requests = Column(Integer, nullable=False)
    concurrency = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)  # in seconds
    status = Column(String, default="pending")  # pending, running, completed, failed
    results = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
