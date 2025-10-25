#!/bin/bash

echo "🚀 =========================================="
echo "   AUTO-SCALING CYCLE TEST"
echo "   Scale UP → Scale DOWN → Scale UP → Scale DOWN"
echo "=========================================="
echo ""

API="http://localhost:8000"

# Function to show current state
show_status() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Current Status:"
    docker ps --filter label=intelliscalesim=true --format "  🐳 {{.Names}}" | head -10
    REPLICAS=$(curl -s "$API/autoscaler/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['managed_containers'].get('test-autoscale',{}).get('replicas',1))" 2>/dev/null)
    echo "  📈 Replica Count: $REPLICAS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ============================================
# PHASE 1: SCALE UP
# ============================================
echo "🔼 PHASE 1: Testing SCALE UP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "1️⃣  Stopping any existing CPU load..."
docker exec test-autoscale pkill -f "while" 2>/dev/null || true
docker exec test-autoscale pkill -f "dd" 2>/dev/null || true
sleep 3

show_status

echo ""
echo "2️⃣  Generating HIGH CPU load..."
docker exec -d test-autoscale sh -c 'while :; do :; done & while :; do :; done & while :; do :; done &' 2>/dev/null

echo "3️⃣  Checking CPU usage..."
sleep 2
CPU=$(docker stats test-autoscale --no-stream --format "{{.CPUPerc}}" 2>/dev/null | sed 's/%//')
echo "  💻 CPU Usage: $CPU%"

echo ""
echo "4️⃣  Waiting for auto-scaler to detect and scale UP..."
echo "  ⏰ Monitoring for 60 seconds..."
for i in {1..12}; do
    echo -n "  [$i/12] "
    sleep 5
    CURRENT_REPLICAS=$(curl -s "$API/autoscaler/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['managed_containers'].get('test-autoscale',{}).get('replicas',1))" 2>/dev/null)
    echo "Replicas: $CURRENT_REPLICAS"
done

echo ""
echo "✅ SCALE UP COMPLETE!"
show_status

# ============================================
# PHASE 2: SCALE DOWN
# ============================================
echo ""
echo ""
echo "🔽 PHASE 2: Testing SCALE DOWN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "1️⃣  Stopping CPU load to trigger scale down..."
docker exec test-autoscale pkill -f "while" 2>/dev/null || true
docker exec test-autoscale pkill -f "dd" 2>/dev/null || true

echo "2️⃣  Checking CPU usage..."
sleep 3
CPU=$(docker stats test-autoscale --no-stream --format "{{.CPUPerc}}" 2>/dev/null | sed 's/%//')
echo "  💻 CPU Usage: $CPU%"

echo ""
echo "3️⃣  Waiting for auto-scaler to detect and scale DOWN..."
echo "  ⏰ Monitoring for 60 seconds..."
for i in {1..12}; do
    echo -n "  [$i/12] "
    sleep 5
    CURRENT_REPLICAS=$(curl -s "$API/autoscaler/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['managed_containers'].get('test-autoscale',{}).get('replicas',1))" 2>/dev/null)
    echo "Replicas: $CURRENT_REPLICAS"
done

echo ""
echo "✅ SCALE DOWN COMPLETE!"
show_status

# ============================================
# PHASE 3: SCALE UP AGAIN
# ============================================
echo ""
echo ""
echo "🔼 PHASE 3: Testing SCALE UP (Round 2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "1️⃣  Generating HIGH CPU load again..."
docker exec -d test-autoscale sh -c 'while :; do :; done & while :; do :; done & while :; do :; done &' 2>/dev/null

echo "2️⃣  Waiting for auto-scaler to scale UP again..."
echo "  ⏰ Monitoring for 60 seconds..."
for i in {1..12}; do
    echo -n "  [$i/12] "
    sleep 5
    CURRENT_REPLICAS=$(curl -s "$API/autoscaler/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['managed_containers'].get('test-autoscale',{}).get('replicas',1))" 2>/dev/null)
    echo "Replicas: $CURRENT_REPLICAS"
done

echo ""
echo "✅ SCALE UP (Round 2) COMPLETE!"
show_status

# ============================================
# PHASE 4: SCALE DOWN AGAIN
# ============================================
echo ""
echo ""
echo "🔽 PHASE 4: Testing SCALE DOWN (Round 2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "1️⃣  Stopping CPU load to trigger final scale down..."
docker exec test-autoscale pkill -f "while" 2>/dev/null || true
docker exec test-autoscale pkill -f "dd" 2>/dev/null || true

echo "2️⃣  Waiting for auto-scaler to scale DOWN to minimum..."
echo "  ⏰ Monitoring for 60 seconds..."
for i in {1..12}; do
    echo -n "  [$i/12] "
    sleep 5
    CURRENT_REPLICAS=$(curl -s "$API/autoscaler/status" | python3 -c "import sys,json; print(json.load(sys.stdin)['managed_containers'].get('test-autoscale',{}).get('replicas',1))" 2>/dev/null)
    echo "Replicas: $CURRENT_REPLICAS"
done

echo ""
echo "✅ SCALE DOWN (Round 2) COMPLETE!"
show_status

# ============================================
# SUMMARY
# ============================================
echo ""
echo ""
echo "🎯 =========================================="
echo "   TEST SUMMARY"
echo "=========================================="

echo ""
echo "📜 Scaling History:"
curl -s "$API/autoscaler/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
history = data.get('history', [])
print(f'Total Events: {len(history)}')
print('')
for i, event in enumerate(history[-10:], 1):
    action = event.get('action', 'UNKNOWN')
    container = event.get('container', 'unknown')
    replicas = event.get('replicas', 0)
    timestamp = event.get('timestamp', 'unknown')[:19]
    emoji = '🔼' if 'UP' in action else '🔽'
    print(f'{emoji} [{i}] {timestamp} - {action}: {container} → {replicas} replicas')
"

echo ""
echo "🎉 =========================================="
echo "   AUTO-SCALING TEST COMPLETE!"
echo "=========================================="
echo ""
echo "📊 Check your browser:"
echo "   • Auto-scaling page - See scaling history"
echo "   • My Containers page - See current containers"
echo "   • Analytics page - See real-time metrics"
echo ""
