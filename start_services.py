#!/usr/bin/env python3
"""Start both backend and frontend services."""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# Load environment variables
env_file = Path('.env')
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv()

def check_port(port):
    """Check if a port is in use."""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def start_backend():
    """Start the FastAPI backend."""
    print("🚀 Starting FastAPI backend on port 9000...")
    
    if check_port(9000):
        print("⚠️  Port 9000 is already in use. Backend may already be running.")
        return None
    
    try:
        process = subprocess.Popen(
            [sys.executable, 'run_backend.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"✅ Backend started (PID: {process.pid})")
        time.sleep(2)  # Give it time to start
        return process
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the Streamlit frontend."""
    print("🚀 Starting Streamlit frontend on port 8501...")
    
    if check_port(8501):
        print("⚠️  Port 8501 is already in use. Frontend may already be running.")
        return None
    
    try:
        process = subprocess.Popen(
            [sys.executable, '-m', 'streamlit', 'run', 'streamlit_app.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"✅ Frontend started (PID: {process.pid})")
        return process
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def main():
    """Main function to start both services."""
    print("=" * 50)
    print("🧬 MRSA Resistance Forecaster - Starting Services")
    print("=" * 50)
    
    # Check dependencies
    try:
        import fastapi
        import streamlit
        import uvicorn
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  Warning: OPENAI_API_KEY not set in environment.")
        print("   The app will work but AI predictions will fail.")
        print("   Create a .env file with OPENAI_API_KEY=your_key")
    
    processes = []
    
    # Start backend
    backend = start_backend()
    if backend:
        processes.append(backend)
    
    # Start frontend
    frontend = start_frontend()
    if frontend:
        processes.append(frontend)
    
    if not processes:
        print("\n❌ No services started. Check for errors above.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Services started successfully!")
    print("=" * 50)
    print("\n📍 Access points:")
    if backend:
        print("   Backend API:  http://localhost:9000")
        print("   API Docs:     http://localhost:9000/docs")
    if frontend:
        print("   Frontend UI:  http://localhost:8501")
    print("\nPress Ctrl+C to stop all services...")
    print("=" * 50 + "\n")
    
    # Wait for interrupt
    try:
        while True:
            time.sleep(1)
            # Check if processes are still alive
            for p in processes:
                if p.poll() is not None:
                    print(f"⚠️  Process {p.pid} exited unexpectedly")
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping services...")
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=5)
            except:
                p.kill()
        print("✅ All services stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()

