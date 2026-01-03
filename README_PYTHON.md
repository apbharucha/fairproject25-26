# MRSA Resistance Forecaster - Python Version

A Python-based application for predicting antibiotic resistance in MRSA using AI and evolutionary modeling.

## Architecture

- **Backend**: FastAPI (REST API)
- **Frontend**: Streamlit (Web UI)
- **Database**: SQLite
- **AI**: OpenAI/OpenRouter API

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your OpenAI API key:

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Run the Application

#### Option A: Run Backend and Frontend Separately

**Terminal 1 - Backend:**

```bash
cd python_backend
python -m api.main
# Or: uvicorn api.main:app --host 0.0.0.0 --port 9000
```

**Terminal 2 - Frontend:**

```bash
streamlit run streamlit_app.py
```

#### Option B: Run with Scripts

Create a simple script to run both (see `run.sh` or `run.bat`).

## Usage

1. Start the FastAPI backend (runs on http://localhost:9000)
2. Start the Streamlit frontend (runs on http://localhost:8501)
3. Open your browser to the Streamlit URL
4. Use the AI Tools to make predictions:
   - **Bayesian Network Modeler**: Enter mecA and PBP2a mutations
   - **Evolutionary Resistance Predictor**: Enter mutation patterns and trajectories

## API Endpoints

- `GET /health` - Health check
- `POST /api/predictions/bayesian` - Create Bayesian prediction
- `POST /api/predictions/evolutionary` - Create evolutionary prediction
- `GET /api/predictions` - List recent predictions
- `GET /api/graphs/{graph_id}` - Get a specific graph/chart

## Project Structure

```
fairproject/
├── python_backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py          # FastAPI application
│   ├── db/
│   │   ├── __init__.py
│   │   └── sqlite_db.py      # Database operations
│   └── ai/
│       ├── __init__.py
│       ├── openai_client.py  # OpenAI/OpenRouter client
│       └── predictions.py    # Prediction functions
├── streamlit_app.py          # Streamlit frontend
├── requirements.txt          # Python dependencies
└── README_PYTHON.md          # This file
```

## Features

- ✅ Bayesian network modeling for resistance prediction
- ✅ Evolutionary trajectory analysis
- ✅ Interactive charts and visualizations
- ✅ Prediction history tracking
- ✅ SQLite database persistence
- ✅ RESTful API for programmatic access

## Migration from TypeScript/Next.js

This Python version maintains the same functionality as the original Next.js application:

- All database operations converted to Python (sqlite3)
- AI prediction functions converted to async Python
- API endpoints match the original structure
- Frontend provides equivalent UI using Streamlit

## Development

### Running Tests

```bash
# Test API endpoints
curl http://localhost:9000/health

# Test prediction
curl -X POST http://localhost:9000/api/predictions/bayesian \
  -H "Content-Type: application/json" \
  -d '{"mecAMutations": ["G246E"], "pbp2aMutations": ["V311A"]}'
```

### Database

The SQLite database is automatically created and initialized on first run. It's located at `sqlite.db` in the project root.

## License

Same as the original project.
