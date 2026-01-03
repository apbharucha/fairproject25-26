@echo off
REM Run both backend and frontend on Windows

REM Check if .env exists
if not exist .env (
    echo Warning: .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo Please edit .env and add your OPENAI_API_KEY
    )
)

REM Load environment variables (Windows)
for /f "tokens=*" %%a in (.env) do set %%a

REM Run backend in background
echo Starting FastAPI backend on port 9000...
start "Backend" python run_backend.py

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Run frontend
echo Starting Streamlit frontend on port 8501...
streamlit run streamlit_app.py

