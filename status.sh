#!/bin/bash
echo "📊 IntelliScaleSim Status"
echo "========================"
echo ""

# Backend check - 404 is OK (means server is running, just no route at /)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 2>/dev/null)
if [ "$BACKEND_STATUS" = "404" ] || [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "302" ]; then
    echo "✅ Backend     (port 8000)"
else
    echo "❌ Backend     (port 8000)"
fi

# Frontend check
if curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null | grep -q "[23]"; then
    echo "✅ Frontend    (port 5173)"
else
    echo "❌ Frontend    (port 5173)"
fi

# Grafana check
if curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "[23]"; then
    echo "✅ Grafana     (port 3000)"
else
    echo "❌ Grafana     (port 3000)"
fi

# Prometheus check
if curl -s --connect-timeout 2 -o /dev/null -w "%{http_code}" http://localhost:9090 2>/dev/null | grep -q "[23]"; then
    echo "✅ Prometheus  (port 9090)"
else
    echo "❌ Prometheus  (port 9090)"
fi

echo ""
echo "Docker Containers:"
CONTAINERS=$(docker ps --format "{{.Names}}" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    docker ps --format "  {{.Names}} - {{.Status}}" 2>/dev/null
else
    echo "  No containers running"
fi

echo ""
echo "========================"
