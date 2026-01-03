#!/bin/bash
# Run both backend and frontend

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Please edit .env and add your OPENAI_API_KEY"
    fi
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "Error: Python not found. Please install Python 3.8 or higher."
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD=$(command -v python3 || command -v python)

# Check dependencies
echo "Checking dependencies..."
$PYTHON_CMD -c "import fastapi, streamlit, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Run backend in background
echo "Starting FastAPI backend on port 9000..."
$PYTHON_CMD run_backend.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Error: Backend failed to start. Check the error messages above."
    exit 1
fi

# Run frontend
echo "Starting Streamlit frontend on port 8501..."
echo "Backend: http://localhost:9000"
echo "Frontend: http://localhost:8501"
streamlit run streamlit_app.py

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

