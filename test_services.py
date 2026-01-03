#!/usr/bin/env python3
"""Test if services can start and dependencies are installed."""
import sys
import os

def test_imports():
    """Test if all required packages can be imported."""
    print("Testing imports...")
    try:
        import fastapi
        print("✅ fastapi")
    except ImportError:
        print("❌ fastapi - run: pip install fastapi")
        return False
    
    try:
        import uvicorn
        print("✅ uvicorn")
    except ImportError:
        print("❌ uvicorn - run: pip install uvicorn")
        return False
    
    try:
        import streamlit
        print("✅ streamlit")
    except ImportError:
        print("❌ streamlit - run: pip install streamlit")
        return False
    
    try:
        import plotly
        print("✅ plotly")
    except ImportError:
        print("❌ plotly - run: pip install plotly")
        return False
    
    try:
        import pandas
        print("✅ pandas")
    except ImportError:
        print("❌ pandas - run: pip install pandas")
        return False
    
    try:
        import httpx
        print("✅ httpx")
    except ImportError:
        print("❌ httpx - run: pip install httpx")
        return False
    
    try:
        import openai
        print("✅ openai")
    except ImportError:
        print("❌ openai - run: pip install openai")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv")
    except ImportError:
        print("⚠️  python-dotenv (optional)")
    
    return True

def test_backend_imports():
    """Test if backend modules can be imported."""
    print("\nTesting backend imports...")
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))
    
    try:
        from db.sqlite_db import get_db
        print("✅ db.sqlite_db")
    except Exception as e:
        print(f"❌ db.sqlite_db: {e}")
        return False
    
    try:
        from ai.openai_client import generate_json
        print("✅ ai.openai_client")
    except Exception as e:
        print(f"⚠️  ai.openai_client: {e} (may need OPENAI_API_KEY)")
    
    try:
        from ai.predictions import predict_resistance_bayesian, predict_resistance_emergence
        print("✅ ai.predictions")
    except Exception as e:
        print(f"❌ ai.predictions: {e}")
        return False
    
    try:
        from api.main import app
        print("✅ api.main")
    except Exception as e:
        print(f"❌ api.main: {e}")
        return False
    
    return True

def test_env():
    """Test environment configuration."""
    print("\nTesting environment...")
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        print(f"✅ OPENAI_API_KEY is set ({'*' * 10})")
    else:
        print("⚠️  OPENAI_API_KEY not set (AI features won't work)")
        if os.path.exists('.env'):
            print("   .env file exists but OPENAI_API_KEY not found in it")
        else:
            print("   .env file not found - create one from .env.example")
    
    return True

def test_ports():
    """Test if ports are available."""
    print("\nTesting ports...")
    import socket
    
    def check_port(port, name):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        if result == 0:
            print(f"⚠️  Port {port} ({name}) is in use")
            return False
        else:
            print(f"✅ Port {port} ({name}) is available")
            return True
    
    backend_ok = check_port(9000, "Backend")
    frontend_ok = check_port(8501, "Frontend")
    
    return backend_ok and frontend_ok

def main():
    """Run all tests."""
    print("=" * 50)
    print("🧪 Testing MRSA Resistance Forecaster Setup")
    print("=" * 50)
    
    all_ok = True
    
    # Test imports
    if not test_imports():
        all_ok = False
    
    # Test backend imports
    if not test_backend_imports():
        all_ok = False
    
    # Test environment
    test_env()
    
    # Test ports
    if not test_ports():
        all_ok = False
    
    print("\n" + "=" * 50)
    if all_ok:
        print("✅ All critical tests passed!")
        print("\nYou can start the services with:")
        print("  python start_services.py")
        print("  or")
        print("  ./run.sh")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("\nTo install dependencies:")
        print("  pip install -r requirements.txt")
    print("=" * 50)

if __name__ == "__main__":
    main()

