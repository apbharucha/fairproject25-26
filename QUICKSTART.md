# Quick Start Guide - Python Version

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

## Running the Application

### Option 1: Run Everything (Recommended)

**On macOS/Linux:**
```bash
./run.sh
```

**On Windows:**
```bash
run.bat
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
python run_backend.py
# Backend runs on http://localhost:9000
```

**Terminal 2 - Frontend:**
```bash
streamlit run streamlit_app.py
# Frontend runs on http://localhost:8501
```

## Usage

1. Open your browser to `http://localhost:8501`
2. Navigate to "AI Tools" in the sidebar
3. Choose a tool:
   - **Bayesian Network Modeler**: Enter mecA and PBP2a mutations
   - **Evolutionary Resistance Predictor**: Enter mutation patterns and trajectories
4. View results and charts
5. Check "Prediction History" to see past predictions

## API Usage

The FastAPI backend provides REST endpoints:

```bash
# Health check
curl http://localhost:9000/health

# Bayesian prediction
curl -X POST http://localhost:9000/api/predictions/bayesian \
  -H "Content-Type: application/json" \
  -d '{
    "mecAMutations": ["G246E"],
    "pbp2aMutations": ["V311A"]
  }'

# Evolutionary prediction
curl -X POST http://localhost:9000/api/predictions/evolutionary \
  -H "Content-Type: application/json" \
  -d '{
    "mutationPatterns": "mecA(G246E), PBP2a(V311A)",
    "evolutionaryTrajectories": "mecA -> PBP2a -> resistance"
  }'

# List predictions
curl http://localhost:9000/api/predictions
```

## Troubleshooting

### Backend won't start
- Check that port 9000 is not in use
- Verify OPENAI_API_KEY is set in .env
- Check Python version: `python --version` (should be 3.8+)

### Frontend can't connect to backend
- Ensure backend is running on port 9000
- Check API_BASE_URL in Streamlit sidebar
- Verify CORS is enabled (it is by default)

### Database errors
- SQLite database is created automatically
- If issues occur, delete `sqlite.db` and restart

## Project Structure

```
fairproject/
├── python_backend/          # Backend code
│   ├── api/                 # FastAPI application
│   ├── db/                  # Database operations
│   └── ai/                  # AI prediction functions
├── streamlit_app.py         # Frontend application
├── requirements.txt         # Python dependencies
├── run_backend.py           # Backend launcher
├── run.sh / run.bat         # Full application launcher
└── README_PYTHON.md         # Full documentation
```

## Features

✅ **Bayesian Network Modeler** - Predicts resistance probabilities based on mutations
✅ **Evolutionary Resistance Predictor** - Models resistance emergence using trajectories
✅ **Interactive Charts** - Visualize predictions with Plotly
✅ **Prediction History** - Track all predictions in SQLite database
✅ **RESTful API** - Programmatic access to all features

## Next Steps

- Read `README_PYTHON.md` for detailed documentation
- Explore the API endpoints at `http://localhost:9000/docs` (FastAPI auto-generated docs)
- Customize the Streamlit UI in `streamlit_app.py`
- Add new prediction models in `python_backend/ai/predictions.py`

