#!/bin/bash

echo "🧪 =========================================="
echo "   IntelliScaleSim Auto-scaling Test"
echo "=========================================="
echo ""

API="http://localhost:8000"

# Check if backend is running
echo "1️⃣  Checking backend status..."
if curl -s "$API/health" > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running!"
    echo "   Please start backend: cd backend && source venv/bin/activate && python main.py"
    exit 1
fi

echo ""
echo "2️⃣  Checking auto-scaler status..."
STATUS=$(curl -s "$API/autoscaler/status" | python3 -m json.tool)
RUNNING=$(echo "$STATUS" | grep '"running"' | grep -o 'true\|false')
echo "   Auto-scaler running: $RUNNING"

if [ "$RUNNING" = "false" ]; then
    echo "   Starting auto-scaler..."
    curl -s -X POST "$API/autoscaler/start" | python3 -m json.tool
fi

echo ""
echo "3️⃣  Current configuration:"
echo "$STATUS" | grep -A 10 '"thresholds"'

echo ""
echo "4️⃣  Deploying test container (nginx - low CPU)..."
docker rm -f test-autoscale 2>/dev/null
docker run -d \
    --name test-autoscale \
    --label intelliscalesim=true \
    -p 8888:80 \
    nginx:alpine

echo "   ✅ Container deployed: test-autoscale"

echo ""
echo "5️⃣  Enabling auto-scaling for test-autoscale..."
curl -s -X POST "$API/autoscaler/enable/test-autoscale" | python3 -m json.tool

echo ""
echo "6️⃣  Current containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" --filter label=intelliscalesim=true

echo ""
echo "7️⃣  Checking metrics..."
sleep 5
curl -s "$API/metrics/system" | python3 -m json.tool

echo ""
echo "=========================================="
echo "✅ Test setup complete!"
echo "=========================================="
echo ""
echo "📋 Next steps:"
echo "   1. Go to browser: http://localhost:5173"
echo "   2. Navigate to 'Auto-scaling' page"
echo "   3. You should see 'test-autoscale' container listed"
echo "   4. Auto-scaling is enabled with Current Replicas: 1"
echo ""
echo "🧪 To test scaling:"
echo "   Method 1: Change thresholds to 5% in UI and save"
echo "   Method 2: Run CPU stress:"
echo "   docker exec test-autoscale sh -c 'while true; do :; done' &"
echo ""
echo "📊 Monitor scaling:"
echo "   - Watch 'Analytics' page for CPU/Memory"
echo "   - Check 'Auto-scaling' page for replica count"
echo "   - Backend terminal will show scaling messages"
echo ""
echo "🛑 To clean up:"
echo "   docker rm -f test-autoscale test-autoscale_replica_*"
echo ""
