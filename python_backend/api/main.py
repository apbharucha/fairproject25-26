"""FastAPI backend for MRSA Resistance Forecaster."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.sqlite_db import get_db
from ai.predictions import predict_resistance_bayesian, predict_resistance_emergence
from api.scrape_data import router as scrape_router

app = FastAPI(title="MRSA Resistance Forecaster API")

# Include data scraping routes
app.include_router(scrape_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class BayesianPredictionRequest(BaseModel):
    mecAMutations: List[str]
    pbp2aMutations: List[str]
    vancomycinResistanceProfile: Optional[str] = None
    ceftarolineResistanceProfile: Optional[str] = None


class EvolutionaryPredictionRequest(BaseModel):
    mutationPatterns: str
    evolutionaryTrajectories: str
    existingKnowledge: Optional[str] = None


class PredictionResponse(BaseModel):
    type: str
    input: Dict[str, Any]
    output: Dict[str, Any]


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "MRSA Resistance Forecaster API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "api_docs": "/docs",
            "predictions": {
                "list": "GET /api/predictions",
                "bayesian": "POST /api/predictions/bayesian",
                "evolutionary": "POST /api/predictions/evolutionary"
            },
            "graphs": "GET /api/graphs/{graph_id}"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/predictions/bayesian", response_model=PredictionResponse)
async def create_bayesian_prediction(request: BayesianPredictionRequest):
    """Create a Bayesian network prediction."""
    try:
        result = await predict_resistance_bayesian(
            mec_a_mutations=request.mecAMutations,
            pbp2a_mutations=request.pbp2aMutations,
            vancomycin_resistance_profile=request.vancomycinResistanceProfile,
            ceftaroline_resistance_profile=request.ceftarolineResistanceProfile
        )
        
        # Save to database
        db = get_db()
        prediction_id = db.add_prediction({
            'type': 'bayesian',
            'input': {
                'mecAMutations': request.mecAMutations,
                'pbp2aMutations': request.pbp2aMutations,
                'vancomycinResistanceProfile': request.vancomycinResistanceProfile,
                'ceftarolineResistanceProfile': request.ceftarolineResistanceProfile
            },
            'output': result
        })
        
        return PredictionResponse(
            type='bayesian',
            input=request.dict(),
            output=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/predictions/evolutionary", response_model=PredictionResponse)
async def create_evolutionary_prediction(request: EvolutionaryPredictionRequest):
    """Create an evolutionary resistance prediction."""
    try:
        result = await predict_resistance_emergence(
            mutation_patterns=request.mutationPatterns,
            evolutionary_trajectories=request.evolutionaryTrajectories,
            existing_knowledge=request.existingKnowledge
        )
        
        # Save to database
        db = get_db()
        prediction_id = db.add_prediction({
            'type': 'evolutionary',
            'input': {
                'mutationPatterns': request.mutationPatterns,
                'evolutionaryTrajectories': request.evolutionaryTrajectories,
                'existingKnowledge': request.existingKnowledge
            },
            'output': result
        })
        
        return PredictionResponse(
            type='evolutionary',
            input=request.dict(),
            output=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/predictions")
async def list_predictions(limit: int = 10):
    """List recent predictions."""
    try:
        db = get_db()
        predictions = db.list_predictions(limit=limit)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load predictions: {str(e)}")


@app.get("/api/graphs/{graph_id}")
async def get_graph(graph_id: int):
    """Get a graph/chart by ID."""
    try:
        db = get_db()
        graph = db.get_graph_by_id(graph_id)
        if not graph:
            raise HTTPException(status_code=404, detail="Graph not found")
        return {"graph": graph}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load graph: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)

