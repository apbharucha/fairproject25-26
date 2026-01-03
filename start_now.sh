#!/bin/bash
# Simple script to start both services after syntax fix

echo "🔧 Fixed syntax error - Starting services..."
echo ""

# Kill any existing processes
pkill -f "run_backend.py" 2>/dev/null
pkill -f "streamlit" 2>/dev/null
sleep 1

# Start backend
echo "🚀 Starting Backend on port 9000..."
cd "$(dirname "$0")"
python3 run_backend.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
sleep 4

# Check if backend is running
if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start. Check backend.log:"
    tail -20 backend.log
    exit 1
fi

# Start frontend
echo ""
echo "🚀 Starting Frontend on port 8501..."
streamlit run streamlit_app.py --server.headless true > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend
sleep 3

echo ""
echo "=========================================="
echo "✅ Services are running!"
echo ""
echo "📍 Access points:"
echo "   Backend:  http://localhost:9000"
echo "   API Docs: http://localhost:9000/docs"
echo "   Frontend: http://localhost:8501"
echo ""
echo "Press Ctrl+C to stop"
echo "=========================================="

# Wait for interrupt
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait

