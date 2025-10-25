#!/bin/bash
echo "🛑 Stopping IntelliScaleSim..."
echo ""

# Stop frontend
if lsof -ti:5173 >/dev/null 2>&1; then
    echo "Stopping frontend..."
    sudo fuser -k 5173/tcp >/dev/null 2>&1
    sleep 1
    echo "✅ Frontend stopped"
fi

# Stop backend (AGGRESSIVE)
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "Stopping backend..."
    sudo fuser -k 8000/tcp >/dev/null 2>&1
    sleep 1
    echo "✅ Backend stopped"
fi

# Stop monitoring
echo "Stopping monitoring stack..."
cd ~/Desktop/intelliscalesim
docker-compose down >/dev/null 2>&1

echo ""
echo "✅ All services stopped!"
echo ""
./status.sh
