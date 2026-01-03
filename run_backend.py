#!/usr/bin/env python3
"""Run the FastAPI backend server."""
import uvicorn
import sys
import os

# Get the project root directory
project_root = os.path.dirname(os.path.abspath(__file__))
python_backend = os.path.join(project_root, 'python_backend')

# Add python_backend to path
if python_backend not in sys.path:
    sys.path.insert(0, python_backend)

# Change to project root for database file
os.chdir(project_root)

if __name__ == "__main__":
    try:
        uvicorn.run(
            "api.main:app",
            host="0.0.0.0",
            port=9000,
            reload=False  # Disable reload to avoid issues
        )
    except Exception as e:
        print(f"Error starting backend: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

