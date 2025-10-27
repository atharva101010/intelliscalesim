from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, load_test, billing, pricing, containers_list
from routes import scenario_billing, realtime_billing, container_metrics
from routes import load_test
from database import init_database, close_database
from contextlib import asynccontextmanager
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting IntelliScaleSim API...")
    init_database()
    print("✅ Server ready!")
    yield
    # Shutdown
    print("🔌 Shutting down IntelliScaleSim API...")
    close_database()
    print("✅ Shutdown complete")

app = FastAPI(
    title="IntelliScaleSim API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(load_test.router)
# app.include_router(deployment.router)
from routers import metrics, autoscaling
app.include_router(metrics.router)
app.include_router(autoscaling.router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "IntelliScaleSim API", "database": "connected"}

@app.get("/")
async def root():
    return {
        "message": "IntelliScaleSim API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
from routes import scenario_billing, load_test, billing, pricing, containers_list
from routes import auth
from routes import realtime_billing
from routes import scenario_billing, container_metrics

app.include_router(load_test.router, prefix="/api", tags=["Load Testing"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])
app.include_router(pricing.router)
app.include_router(containers_list.router)
app.include_router(scenario_billing.router)
app.include_router(realtime_billing.router)
app.include_router(container_metrics.router)
