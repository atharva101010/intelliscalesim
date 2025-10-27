# Add these imports at the top with other router imports
from routers import metrics, autoscaling

# Then in the app setup section, add these lines:
app.include_router(metrics.router)
app.include_router(autoscaling.router)
