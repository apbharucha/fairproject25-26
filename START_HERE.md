# 🚀 START HERE - Quick Start Guide

## If Services Are Down - Use This:

### Option 1: Simple Script (Recommended)
```bash
./quick_start.sh
```

### Option 2: Python Script
```bash
python3 start_all.py
```

### Option 3: Manual Start

**Terminal 1:**
```bash
python3 run_backend.py
```

**Terminal 2:**
```bash
streamlit run streamlit_app.py
```

## Verify Services Are Running

**Check Backend:**
```bash
curl http://localhost:9000/health
# Should return: {"status":"ok"}
```

**Check Frontend:**
Open browser: http://localhost:8501

## If Still Not Working

1. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Check for port conflicts:**
   ```bash
   lsof -i :9000  # Backend port
   lsof -i :8501  # Frontend port
   ```

3. **Kill existing processes:**
   ```bash
pkill -f "run_backend.py"
pkill -f "streamlit"
```

4. **Check logs:**
   - Backend: `backend.log` or terminal output
   - Frontend: `frontend.log` or terminal output

## Quick Test

Run this to test everything:
```bash
python3 test_services.py
```

## Need Help?

See `TROUBLESHOOTING.md` for detailed solutions.

