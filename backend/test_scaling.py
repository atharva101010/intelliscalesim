#!/usr/bin/env python3
from autoscaler import autoscaler
import time

print("🧪 Testing autoscaler manually...")
print(f"Running: {autoscaler.running}")
print(f"Thresholds: CPU={autoscaler.cpu_scale_up_threshold}%, Memory={autoscaler.memory_scale_up_threshold}%")

# Get current stats
stats = autoscaler.get_container_stats()
print(f"\n📊 Current container stats:")
for stat in stats:
    print(f"  - {stat['name']}: CPU={stat['cpu']}%, Memory={stat['memory']}%")

# Manually run check_and_scale
print("\n🔄 Running check_and_scale()...")
autoscaler.check_and_scale()

# Check status
time.sleep(2)
status = autoscaler.get_status()
print(f"\n📈 Status after check:")
print(f"  Managed containers: {status['managed_containers']}")
print(f"  History: {status['history']}")
