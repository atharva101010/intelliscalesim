from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import httpx
import asyncio
import time
import psutil
from database import get_db
from models import LoadTest

router = APIRouter(prefix="/api/loadtest", tags=["Load Testing"])

# Validation limits
MAX_REQUESTS = 1000
MAX_CONCURRENCY = 50
MAX_DURATION = 60  # seconds

class LoadTestRequest(BaseModel):
    target_url: str
    total_requests: int
    concurrency: int
    duration: int  # in seconds
    
    @validator('target_url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        # Check if it's a localhost/deployment URL
        if 'localhost' not in v and '127.0.0.1' not in v and not any(x in v for x in ['.com', '.org', '.net', '.io']):
            raise ValueError('Can only test deployed applications')
        return v
    
    @validator('total_requests')
    def validate_requests(cls, v):
        if v < 1:
            raise ValueError('Requests must be at least 1')
        if v > MAX_REQUESTS:
            raise ValueError(f'Maximum requests allowed: {MAX_REQUESTS}')
        return v
    
    @validator('concurrency')
    def validate_concurrency(cls, v):
        if v < 1:
            raise ValueError('Concurrency must be at least 1')
        if v > MAX_CONCURRENCY:
            raise ValueError(f'Concurrency cannot exceed {MAX_CONCURRENCY}')
        return v
    
    @validator('duration')
    def validate_duration(cls, v):
        if v < 1:
            raise ValueError('Duration must be at least 1 second')
        if v > MAX_DURATION:
            raise ValueError(f'Time should not exceed more than {MAX_DURATION} seconds')
        return v

class LoadTestResponse(BaseModel):
    id: int
    message: str
    status: str

# Store active test progress
active_tests = {}

@router.post("/start", response_model=LoadTestResponse)
async def start_load_test(
    request: LoadTestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new load test with validation"""
    
    # Create database record
    load_test = LoadTest(
        target_url=request.target_url,
        total_requests=request.total_requests,
        concurrency=request.concurrency,
        duration=request.duration,
        status="running"
    )
    db.add(load_test)
    db.commit()
    db.refresh(load_test)
    
    # Initialize progress tracking
    active_tests[load_test.id] = {
        "progress": 0,
        "requests_sent": 0,
        "successful": 0,
        "failed": 0,
        "cpu_usage": [],
        "memory_usage": [],
        "status": "running"
    }
    
    # Run load test in background
    background_tasks.add_task(run_load_test_with_monitoring, load_test.id, request)
    
    return LoadTestResponse(
        id=load_test.id,
        message="Load test started",
        status="running"
    )

async def run_load_test_with_monitoring(test_id: int, request: LoadTestRequest):
    """Execute load test with real-time CPU/Memory monitoring"""
    from database import SessionLocal
    db = SessionLocal()
    
    try:
        start_time = time.time()
        test_duration = request.duration
        total_requests = request.total_requests
        concurrency = request.concurrency
        
        requests_sent = 0
        successful_requests = 0
        failed_requests = 0
        response_times = []
        
        # Calculate batch distribution
        batch_size = min(concurrency, total_requests)
        total_batches = (total_requests + batch_size - 1) // batch_size
        delay_between_batches = test_duration / total_batches if total_batches > 1 else 0
        
        print(f"🚀 Starting monitored load test: {total_requests} requests over {test_duration}s")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            while requests_sent < total_requests:
                elapsed = time.time() - start_time
                
                # Stop if duration exceeded
                if elapsed >= test_duration:
                    break
                
                # Monitor CPU and Memory
                cpu_percent = psutil.cpu_percent(interval=0.1)
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                
                # Update progress
                progress = min((requests_sent / total_requests) * 100, 100)
                active_tests[test_id].update({
                    "progress": round(progress, 1),
                    "requests_sent": requests_sent,
                    "successful": successful_requests,
                    "failed": failed_requests,
                    "cpu_usage": active_tests[test_id]["cpu_usage"][-20:] + [cpu_percent],  # Keep last 20 readings
                    "memory_usage": active_tests[test_id]["memory_usage"][-20:] + [memory_percent]
                })
                
                # Send batch
                remaining_requests = total_requests - requests_sent
                current_batch_size = min(batch_size, remaining_requests)
                
                tasks = []
                for _ in range(current_batch_size):
                    if requests_sent < total_requests:
                        tasks.append(send_request(client, request.target_url, response_times))
                        requests_sent += 1
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in results:
                    if isinstance(result, Exception) or not result:
                        failed_requests += 1
                    else:
                        successful_requests += 1
                
                # Wait before next batch
                if requests_sent < total_requests:
                    elapsed_after_batch = time.time() - start_time
                    remaining_time = test_duration - elapsed_after_batch
                    
                    if remaining_time > 0 and delay_between_batches > 0:
                        sleep_time = min(delay_between_batches, remaining_time)
                        await asyncio.sleep(sleep_time)
        
        # Calculate results
        actual_duration = time.time() - start_time
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        min_response_time = min(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        requests_per_second = requests_sent / actual_duration if actual_duration > 0 else 0
        
        # Final CPU/Memory reading
        final_cpu = psutil.cpu_percent(interval=0.1)
        final_memory = psutil.virtual_memory().percent
        
        results = {
            "total_requests_sent": requests_sent,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "actual_duration": round(actual_duration, 2),
            "specified_duration": test_duration,
            "requests_per_second": round(requests_per_second, 2),
            "avg_response_time": round(avg_response_time, 3),
            "min_response_time": round(min_response_time, 3),
            "max_response_time": round(max_response_time, 3),
            "avg_cpu_usage": round(sum(active_tests[test_id]["cpu_usage"]) / len(active_tests[test_id]["cpu_usage"]), 2) if active_tests[test_id]["cpu_usage"] else 0,
            "avg_memory_usage": round(sum(active_tests[test_id]["memory_usage"]) / len(active_tests[test_id]["memory_usage"]), 2) if active_tests[test_id]["memory_usage"] else 0,
            "peak_cpu_usage": round(max(active_tests[test_id]["cpu_usage"]), 2) if active_tests[test_id]["cpu_usage"] else 0,
            "peak_memory_usage": round(max(active_tests[test_id]["memory_usage"]), 2) if active_tests[test_id]["memory_usage"] else 0
        }
        
        # Update database
        test = db.query(LoadTest).filter(LoadTest.id == test_id).first()
        test.status = "completed"
        test.results = results
        db.commit()
        
        # Update progress
        active_tests[test_id]["status"] = "completed"
        active_tests[test_id]["progress"] = 100
        
        print(f"✅ Load test completed: {requests_sent}/{total_requests} in {actual_duration:.2f}s")
        
    except Exception as e:
        print(f"❌ Load test failed: {str(e)}")
        test = db.query(LoadTest).filter(LoadTest.id == test_id).first()
        test.status = "failed"
        test.results = {"error": str(e)}
        db.commit()
        active_tests[test_id]["status"] = "failed"
    finally:
        db.close()

async def send_request(client: httpx.AsyncClient, url: str, response_times: list) -> bool:
    """Send a single HTTP request and record response time"""
    try:
        req_start = time.time()
        response = await client.get(url)
        req_duration = time.time() - req_start
        response_times.append(req_duration)
        return 200 <= response.status_code < 400
    except Exception:
        return False

@router.get("/progress/{test_id}")
async def get_test_progress(test_id: int):
    """Get real-time progress of a running test"""
    if test_id not in active_tests:
        raise HTTPException(status_code=404, detail="Test not found or completed")
    return active_tests[test_id]

@router.get("/history")
async def get_load_test_history(db: Session = Depends(get_db)):
    """Get all load test history"""
    tests = db.query(LoadTest).order_by(LoadTest.created_at.desc()).limit(50).all()
    return [{
        "id": test.id,
        "target_url": test.target_url,
        "total_requests": test.total_requests,
        "concurrency": test.concurrency,
        "duration": test.duration,
        "status": test.status,
        "results": test.results,
        "created_at": test.created_at.isoformat() if test.created_at else None
    } for test in tests]

@router.get("/{test_id}")
async def get_load_test(test_id: int, db: Session = Depends(get_db)):
    """Get a specific load test by ID"""
    test = db.query(LoadTest).filter(LoadTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Load test not found")
    
    return {
        "id": test.id,
        "target_url": test.target_url,
        "total_requests": test.total_requests,
        "concurrency": test.concurrency,
        "duration": test.duration,
        "status": test.status,
        "results": test.results,
        "created_at": test.created_at.isoformat() if test.created_at else None
    }

@router.get("/limits/info")
async def get_limits():
    """Get system limits for load testing"""
    return {
        "max_requests": MAX_REQUESTS,
        "max_concurrency": MAX_CONCURRENCY,
        "max_duration": MAX_DURATION
    }
