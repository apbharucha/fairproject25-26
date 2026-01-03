#!/bin/bash
# Quick start script - kills existing and starts fresh

echo "🧬 MRSA Resistance Forecaster - Quick Start"
echo "=========================================="

# Kill existing processes
echo "Cleaning up..."
pkill -f "run_backend.py" 2>/dev/null
pkill -f "streamlit" 2>/dev/null
sleep 2

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found!"
    exit 1
fi

# Check dependencies
echo "Checking dependencies..."
python3 -c "import fastapi, streamlit, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Start backend in background
echo ""
echo "🚀 Starting Backend (port 9000)..."
cd "$(dirname "$0")"
python3 run_backend.py > backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log"
    cat backend.log
    exit 1
fi

echo "✅ Backend running (PID: $BACKEND_PID)"

# Start frontend
echo ""
echo "🚀 Starting Frontend (port 8501)..."
streamlit run streamlit_app.py --server.headless true > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check if frontend started
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log"
    cat frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo ""
echo "=========================================="
echo "✅ Services are running!"
echo ""
echo "📍 Access points:"
echo "   Backend:  http://localhost:9000"
echo "   Frontend: http://localhost:8501"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="

# Wait for interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

