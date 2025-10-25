import asyncio
import time
import psutil
from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, validator
import uuid
import aiohttp

class LoadTestRequest(BaseModel):
    target_url: str
    total_requests: int
    concurrency: int
    duration_seconds: int
    method: str = "GET"
    
    @validator('target_url')
    def validate_url(cls, v):
        if not (v.startswith('http://localhost:') or v.startswith('http://127.0.0.1:')):
            raise ValueError('Only localhost URLs are allowed for security')
        return v
    
    @validator('total_requests')
    def validate_total_requests(cls, v):
        if v < 1 or v > 1000:
            raise ValueError('total_requests must be between 1 and 1000')
        return v
    
    @validator('concurrency')
    def validate_concurrency(cls, v):
        if v < 1 or v > 50:
            raise ValueError('concurrency must be between 1 and 50')
        return v
    
    @validator('duration_seconds')
    def validate_duration(cls, v):
        if v < 1 or v > 60:
            raise ValueError('duration_seconds must be between 1 and 60')
        return v

class LoadTestResult(BaseModel):
    test_id: str
    status: str  # running, completed, failed
    progress: float  # 0-100
    total_requests: int
    completed_requests: int
    failed_requests: int
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    requests_per_second: float
    cpu_usage: List[float]
    memory_usage: List[float]
    started_at: str
    completed_at: Optional[str] = None
    actual_duration: Optional[float] = None

# Store test results in memory
test_results: Dict[str, LoadTestResult] = {}

async def make_request(session: aiohttp.ClientSession, url: str, method: str) -> Dict:
    """Make a single HTTP request and return timing info"""
    start_time = time.time()
    try:
        async with session.request(method, url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            await response.read()
            elapsed = (time.time() - start_time) * 1000  # Convert to ms
            return {
                'success': True,
                'status_code': response.status,
                'response_time': elapsed
            }
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return {
            'success': False,
            'error': str(e),
            'response_time': elapsed
        }

async def monitor_resources(test_id: str, stop_event: asyncio.Event):
    """Monitor CPU and memory usage during test"""
    while not stop_event.is_set():
        try:
            cpu = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory().percent
            
            if test_id in test_results:
                test_results[test_id].cpu_usage.append(cpu)
                test_results[test_id].memory_usage.append(memory)
        except:
            pass
        
        await asyncio.sleep(1)

async def run_load_test(test_id: str, request: LoadTestRequest):
    """Run load test with exact requests over exact duration"""
    try:
        # Initialize result
        result = LoadTestResult(
            test_id=test_id,
            status='running',
            progress=0.0,
            total_requests=request.total_requests,
            completed_requests=0,
            failed_requests=0,
            avg_response_time=0.0,
            min_response_time=0.0,
            max_response_time=0.0,
            requests_per_second=0.0,
            cpu_usage=[],
            memory_usage=[],
            started_at=datetime.now().isoformat()
        )
        
        test_results[test_id] = result
        
        # Store results
        results = []
        
        # Calculate delay between each request to spread over duration
        # delay = duration / total_requests
        delay_per_request = request.duration_seconds / request.total_requests
        
        # Start time
        start_time = time.time()
        
        # Create stop event for monitor
        stop_event = asyncio.Event()
        
        # Start resource monitor
        monitor_task = asyncio.create_task(monitor_resources(test_id, stop_event))
        
        # Create aiohttp session
        connector = aiohttp.TCPConnector(limit=request.concurrency * 2)
        async with aiohttp.ClientSession(connector=connector) as session:
            # Create semaphore to limit concurrency
            semaphore = asyncio.Semaphore(request.concurrency)
            
            async def make_single_request(req_num):
                async with semaphore:
                    # Calculate when this request should be sent
                    target_time = start_time + (req_num * delay_per_request)
                    current_time = time.time()
                    
                    # Wait until it's time to send this request
                    wait_time = target_time - current_time
                    if wait_time > 0:
                        await asyncio.sleep(wait_time)
                    
                    # Make the request
                    result = await make_request(session, request.target_url, request.method)
                    results.append(result)
                    
                    # Update progress
                    if test_id in test_results:
                        completed = len([r for r in results if r['success']])
                        failed = len([r for r in results if not r['success']])
                        
                        response_times = [r['response_time'] for r in results]
                        
                        test_results[test_id].completed_requests = completed
                        test_results[test_id].failed_requests = failed
                        test_results[test_id].progress = (len(results) / request.total_requests) * 100
                        
                        elapsed = time.time() - start_time
                        if elapsed > 0:
                            test_results[test_id].requests_per_second = len(results) / elapsed
                        
                        if response_times:
                            test_results[test_id].avg_response_time = sum(response_times) / len(response_times)
                            test_results[test_id].min_response_time = min(response_times)
                            test_results[test_id].max_response_time = max(response_times)
            
            # Create all request tasks
            tasks = [make_single_request(i) for i in range(request.total_requests)]
            
            # Wait for all requests to complete
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Stop monitor
        stop_event.set()
        await monitor_task
        
        # Calculate final statistics
        actual_duration = time.time() - start_time
        completed = len([r for r in results if r['success']])
        failed = len([r for r in results if not r['success']])
        
        response_times = [r['response_time'] for r in results]
        
        # Update final result
        if test_id in test_results:
            test_results[test_id].status = 'completed'
            test_results[test_id].progress = 100.0
            test_results[test_id].completed_requests = completed
            test_results[test_id].failed_requests = failed
            test_results[test_id].actual_duration = actual_duration
            test_results[test_id].requests_per_second = len(results) / actual_duration if actual_duration > 0 else 0
            test_results[test_id].completed_at = datetime.now().isoformat()
            
            if response_times:
                test_results[test_id].avg_response_time = sum(response_times) / len(response_times)
                test_results[test_id].min_response_time = min(response_times)
                test_results[test_id].max_response_time = max(response_times)
        
    except Exception as e:
        if test_id in test_results:
            test_results[test_id].status = 'failed'
            test_results[test_id].completed_at = datetime.now().isoformat()
        raise e

def start_load_test(request: LoadTestRequest) -> str:
    """Start a new load test in background"""
    test_id = str(uuid.uuid4())
    
    # Run in background
    asyncio.create_task(run_load_test(test_id, request))
    
    return test_id

def get_test_result(test_id: str) -> Optional[LoadTestResult]:
    """Get test result by ID"""
    return test_results.get(test_id)

def get_all_tests() -> List[LoadTestResult]:
    """Get all test results"""
    return list(test_results.values())

def delete_test(test_id: str) -> bool:
    """Delete a test result"""
    if test_id in test_results:
        del test_results[test_id]
        return True
    return False
