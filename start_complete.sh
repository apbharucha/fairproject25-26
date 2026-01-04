#!/bin/bash

###############################################################################
# Complete startup script for MRSA Resistance Forecaster
# Ensures both backend and frontend are running correctly
###############################################################################

set -e

WORKSPACE="/workspaces/fairproject25-26"
VENV="$WORKSPACE/.venv"
BACKEND_LOG="$WORKSPACE/backend.log"
STREAMLIT_LOG="$WORKSPACE/streamlit.log"

echo "🧬 MRSA Resistance Forecaster - Complete Startup"
echo "=================================================="
echo ""

# Step 1: Kill any existing processes
echo "🛑 Cleaning up old processes..."
pkill -9 -f "streamlit" 2>/dev/null || true
pkill -9 -f "python.*main.py" 2>/dev/null || true
sleep 2

# Step 2: Verify virtual environment exists
if [ ! -d "$VENV" ]; then
    echo "❌ Virtual environment not found at $VENV"
    echo "Please create it with: python3 -m venv $VENV"
    exit 1
fi

# Step 3: Ensure dependencies are installed
echo "📦 Checking dependencies..."
"$VENV/bin/pip" install -q fastapi==0.115.0 uvicorn[standard]==0.32.0 pydantic==2.9.2 python-multipart==0.0.12 aiosqlite==0.20.0 openai==1.54.3 httpx==0.27.2 streamlit==1.39.0 plotly==5.24.1 pandas==2.2.3 python-dotenv==1.0.1 2>/dev/null || true

# Step 4: Clear caches
echo "🧹 Clearing caches..."
rm -rf ~/.streamlit ~/.cache 2>/dev/null || true
rm -f "$BACKEND_LOG" "$STREAMLIT_LOG" 2>/dev/null || true

# Step 5: Start backend
echo "🚀 Starting Backend API (port 9000)..."
cd "$WORKSPACE"
"$VENV/bin/python" python_backend/api/main.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:9000/health >/dev/null 2>&1; then
        echo "✅ Backend is running (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start. Check $BACKEND_LOG"
        exit 1
    fi
    sleep 1
done

# Step 6: Test dataset-stats endpoint
echo "📊 Testing dataset statistics endpoint..."
RESPONSE=$(curl -s http://127.0.0.1:9000/api/dataset-stats)
if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Dataset endpoint responding correctly"
else
    echo "⚠️  Dataset endpoint may have issues. Response:"
    echo "$RESPONSE"
fi

# Step 7: Start Streamlit
echo "🎨 Starting Streamlit Frontend (port 8501)..."
"$VENV/bin/streamlit" run streamlit_app.py \
    --server.enableCORS=false \
    --server.enableXsrfProtection=false \
    --logger.level=error \
    > "$STREAMLIT_LOG" 2>&1 &
STREAMLIT_PID=$!

# Wait for Streamlit to start
echo "⏳ Waiting for Streamlit to start..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8501 >/dev/null 2>&1; then
        echo "✅ Streamlit is running (PID: $STREAMLIT_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Streamlit startup timed out. Check $STREAMLIT_LOG"
        break
    fi
    sleep 1
done

# Step 8: Final status
echo ""
echo "=================================================="
echo "✅ MRSA Resistance Forecaster is ready!"
echo "=================================================="
echo ""
echo "🌐 Frontend: http://localhost:8501"
echo "⚙️  Backend:  http://localhost:9000"
echo ""
echo "📝 Logs:"
echo "   Backend:  $BACKEND_LOG"
echo "   Frontend: $STREAMLIT_LOG"
echo ""
echo "To stop the services, run:"
echo "   pkill -f streamlit && pkill -f main.py"
echo ""

# Keep script running
wait
