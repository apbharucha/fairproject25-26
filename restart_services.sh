#!/bin/bash
# Restart services - kills existing and starts fresh

echo "🔄 Restarting MRSA Resistance Forecaster Services..."
echo ""

# Kill existing
echo "Stopping existing services..."
pkill -f "run_backend.py" 2>/dev/null
pkill -f "streamlit" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 2

# Check ports
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

if check_port 9000; then
    echo "⚠️  Port 9000 still in use, force killing..."
    lsof -ti:9000 | xargs kill -9 2>/dev/null
    sleep 1
fi

if check_port 8501; then
    echo "⚠️  Port 8501 still in use, force killing..."
    lsof -ti:8501 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start services
echo "Starting services..."
./quick_start.sh

