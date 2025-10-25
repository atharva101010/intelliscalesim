#!/bin/bash
echo "🚀 Starting IntelliScaleSim..."
echo ""

cd ~/Desktop/intelliscalesim
mkdir -p logs

# Start monitoring
echo "Starting monitoring stack..."
docker-compose up -d
sleep 3
echo "✅ Monitoring started"

# Start backend
echo "Starting backend..."
cd backend
source venv/bin/activate
nohup python main.py > ../logs/backend.log 2>&1 &
echo "✅ Backend started (PID: $!)"
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
echo "✅ Frontend started (PID: $!)"
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Access:"
echo "   Frontend:   http://localhost:5173"
echo "   Backend:    http://localhost:8000"
echo "   Grafana:    http://localhost:3000"
echo "   Prometheus: http://localhost:9090"
