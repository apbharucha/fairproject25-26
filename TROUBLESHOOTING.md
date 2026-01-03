# Troubleshooting Guide

## Both Frontend and Backend Down

### Quick Fix

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env and add: OPENAI_API_KEY=your_key_here
   ```

3. **Start services using the helper script:**
   ```bash
   python start_services.py
   ```

### Manual Start

**Terminal 1 - Backend:**

```bash
python run_backend.py
```

**Terminal 2 - Frontend:**

```bash
streamlit run streamlit_app.py
```

### Common Issues

#### 1. Port Already in Use

**Error:** `Address already in use` or port conflict

**Solution:**

```bash
# Find what's using the port
lsof -i :9000  # Backend
lsof -i :8501  # Frontend

# Kill the process
kill -9 <PID>
```

#### 2. Missing Dependencies

**Error:** `ModuleNotFoundError` or `ImportError`

**Solution:**

```bash
pip install -r requirements.txt
```

#### 3. OpenAI API Key Not Set

**Error:** `OPENAI_API_KEY is not set`

**Solution:**

```bash
# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

# Or export directly
export OPENAI_API_KEY=your_key_here
```

#### 4. Import Errors in Backend

**Error:** `ModuleNotFoundError: No module named 'db'` or similar

**Solution:**
Make sure you're running from the project root:

```bash
cd /Users/aavibharucha/Documents/fairproject
python run_backend.py
```

#### 5. Database Errors

**Error:** SQLite database errors

**Solution:**

```bash
# Delete and recreate database
rm sqlite.db sqlite.db-shm sqlite.db-wal
# Restart backend - it will recreate the database
```

### Verify Services Are Running

**Check backend:**

```bash
curl http://localhost:9000/health
# Should return: {"status":"ok"}
```

**Check frontend:**
Open browser to: `http://localhost:8501`

### Check Logs

**Backend logs:**

- Check terminal where `run_backend.py` is running
- Or check `python_backend/api/main.py` for print statements

**Frontend logs:**

- Check terminal where `streamlit run` is running
- Streamlit shows errors in the browser

### Reset Everything

```bash
# Stop all Python processes
pkill -f "run_backend.py"
pkill -f "streamlit"

# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Start fresh
python start_services.py
```

### Still Having Issues?

1. Check Python version: `python --version` (needs 3.8+)
2. Check if ports are free: `lsof -i :9000` and `lsof -i :8501`
3. Verify .env file exists and has OPENAI_API_KEY
4. Try running services separately to isolate the issue
