#!/usr/bin/env python3
"""Simple script to start both backend and frontend."""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# Load .env if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def kill_existing():
    """Kill any existing processes on our ports."""
    import socket
    import subprocess
    
    ports = [9000, 8501]
    for port in ports:
        try:
            # Try to find and kill process using the port
            if sys.platform == 'darwin':  # macOS
                result = subprocess.run(
                    ['lsof', '-ti', f':{port}'],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0 and result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        try:
                            os.kill(int(pid), signal.SIGTERM)
                            print(f"Killed process {pid} on port {port}")
                        except:
                            pass
            elif sys.platform == 'win32':  # Windows
                result = subprocess.run(
                    ['netstat', '-ano'],
                    capture_output=True,
                    text=True
                )
                # Parse and kill (simplified)
                pass
        except Exception as e:
            print(f"Could not check port {port}: {e}")

def start_backend():
    """Start backend."""
    print("=" * 60)
    print("Starting FastAPI Backend on http://localhost:9000")
    print("=" * 60)
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_script = os.path.join(project_root, 'run_backend.py')
    
    try:
        process = subprocess.Popen(
            [sys.executable, backend_script],
            cwd=project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Wait a bit and check if it's still running
        time.sleep(2)
        if process.poll() is None:
            print(f"✅ Backend started (PID: {process.pid})")
            return process
        else:
            stdout, _ = process.communicate()
            print(f"❌ Backend failed to start:")
            print(stdout)
            return None
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        import traceback
        traceback.print_exc()
        return None

def start_frontend():
    """Start frontend."""
    print("\n" + "=" * 60)
    print("Starting Streamlit Frontend on http://localhost:8501")
    print("=" * 60)
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    frontend_script = os.path.join(project_root, 'streamlit_app.py')
    
    try:
        process = subprocess.Popen(
            [sys.executable, '-m', 'streamlit', 'run', frontend_script, '--server.headless', 'true'],
            cwd=project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Wait a bit and check if it's still running
        time.sleep(3)
        if process.poll() is None:
            print(f"✅ Frontend started (PID: {process.pid})")
            return process
        else:
            stdout, _ = process.communicate()
            print(f"❌ Frontend failed to start:")
            print(stdout)
            return None
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main function."""
    print("\n" + "🧬" * 30)
    print("MRSA Resistance Forecaster - Starting Services")
    print("🧬" * 30 + "\n")
    
    # Kill existing processes
    print("Cleaning up existing processes...")
    kill_existing()
    time.sleep(1)
    
    # Check dependencies
    print("\nChecking dependencies...")
    try:
        import fastapi
        import streamlit
        import uvicorn
        print("✅ All dependencies installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\nPlease run: pip install -r requirements.txt")
        sys.exit(1)
    
    # Start backend
    backend = start_backend()
    if not backend:
        print("\n❌ Failed to start backend. Check errors above.")
        sys.exit(1)
    
    # Start frontend
    frontend = start_frontend()
    if not frontend:
        print("\n❌ Failed to start frontend. Check errors above.")
        if backend:
            backend.terminate()
        sys.exit(1)
    
    # Success message
    print("\n" + "=" * 60)
    print("✅ Both services are running!")
    print("=" * 60)
    print("\n📍 Access your application:")
    print("   Backend API:  http://localhost:9000")
    print("   API Docs:     http://localhost:9000/docs")
    print("   Frontend UI:  http://localhost:8501")
    print("\nPress Ctrl+C to stop all services")
    print("=" * 60 + "\n")
    
    # Monitor processes
    try:
        while True:
            time.sleep(1)
            if backend.poll() is not None:
                print("\n⚠️  Backend process exited!")
                break
            if frontend.poll() is not None:
                print("\n⚠️  Frontend process exited!")
                break
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping services...")
    
    # Cleanup
    print("Terminating processes...")
    if backend:
        try:
            backend.terminate()
            backend.wait(timeout=5)
        except:
            backend.kill()
    
    if frontend:
        try:
            frontend.terminate()
            frontend.wait(timeout=5)
        except:
            frontend.kill()
    
    print("✅ All services stopped.")
    sys.exit(0)

if __name__ == "__main__":
    main()

