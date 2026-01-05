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
from ai.predictions import (
    predict_resistance_bayesian,
    predict_resistance_emergence,
    predict_resistance_ml,
    predict_oxacillin_resistance
)
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
    oxacillinResistanceProfile: Optional[str] = None


class EvolutionaryPredictionRequest(BaseModel):
    mutationPatterns: str
    evolutionaryTrajectories: str
    existingKnowledge: Optional[str] = None


class MLPredictionRequest(BaseModel):
    mecAMutations: List[str]
    pbp2aMutations: List[str]
    modelType: str = "ensemble"  # "svm", "random_forest", or "ensemble"
    sccmecType: Optional[str] = None
    additionalGenes: Optional[List[str]] = None


class OxacillinPredictionRequest(BaseModel):
    mecAMutations: List[str]
    pbp2aMutations: List[str]
    sccmecType: Optional[str] = None
    additionalGenes: Optional[List[str]] = None
    strainInfo: Optional[str] = None


class PredictionResponse(BaseModel):
    type: str
    input: Dict[str, Any]
    output: Dict[str, Any]


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "MRSA Resistance Forecaster API",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "api_docs": "/docs",
            "predictions": {
                "list": "GET /api/predictions",
                "bayesian": "POST /api/predictions/bayesian",
                "evolutionary": "POST /api/predictions/evolutionary",
                "ml": "POST /api/predictions/ml",
                "oxacillin": "POST /api/predictions/oxacillin"
            },
            "graphs": "GET /api/graphs/{graph_id}",
            "data": {
                "scrape": "POST /api/scrape-data",
                "stats": "GET /api/dataset-stats"
            }
        },
        "models": {
            "bayesian": "Bayesian Network Model with AI integration",
            "evolutionary": "Evolutionary Resistance Predictor",
            "svm": "Support Vector Machine classifier",
            "random_forest": "Random Forest classifier",
            "ensemble": "Ensemble (SVM + Random Forest)"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/predictions/bayesian", response_model=PredictionResponse)
async def create_bayesian_prediction(request: BayesianPredictionRequest):
    """Create a Bayesian network prediction including oxacillin resistance."""
    try:
        result = await predict_resistance_bayesian(
            mec_a_mutations=request.mecAMutations,
            pbp2a_mutations=request.pbp2aMutations,
            vancomycin_resistance_profile=request.vancomycinResistanceProfile,
            ceftaroline_resistance_profile=request.ceftarolineResistanceProfile,
            oxacillin_resistance_profile=request.oxacillinResistanceProfile
        )
        
        # Save to database
        db = get_db()
        prediction_id = db.add_prediction({
            'type': 'bayesian',
            'input': {
                'mecAMutations': request.mecAMutations,
                'pbp2aMutations': request.pbp2aMutations,
                'vancomycinResistanceProfile': request.vancomycinResistanceProfile,
                'ceftarolineResistanceProfile': request.ceftarolineResistanceProfile,
                'oxacillinResistanceProfile': request.oxacillinResistanceProfile
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


@app.post("/api/predictions/ml", response_model=PredictionResponse)
async def create_ml_prediction(request: MLPredictionRequest):
    """
    Create a Machine Learning prediction using SVM, Random Forest, or Ensemble.
    
    Model types:
    - "svm": Support Vector Machine
    - "random_forest": Random Forest Classifier
    - "ensemble": Combined SVM + Random Forest (default)
    """
    try:
        result = await predict_resistance_ml(
            mec_a_mutations=request.mecAMutations,
            pbp2a_mutations=request.pbp2aMutations,
            model_type=request.modelType,
            sccmec_type=request.sccmecType,
            additional_genes=request.additionalGenes
        )
        
        # Save to database
        db = get_db()
        prediction_id = db.add_prediction({
            'type': f'ml_{request.modelType}',
            'input': {
                'mecAMutations': request.mecAMutations,
                'pbp2aMutations': request.pbp2aMutations,
                'modelType': request.modelType,
                'sccmecType': request.sccmecType,
                'additionalGenes': request.additionalGenes
            },
            'output': result
        })
        
        return PredictionResponse(
            type=f'ml_{request.modelType}',
            input=request.dict(),
            output=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Prediction failed: {str(e)}")


@app.post("/api/predictions/oxacillin", response_model=PredictionResponse)
async def create_oxacillin_prediction(request: OxacillinPredictionRequest):
    """
    Specialized oxacillin resistance prediction.
    
    Uses ensemble ML models with SCCmec cassette analysis for
    comprehensive oxacillin resistance assessment.
    """
    try:
        result = await predict_oxacillin_resistance(
            mec_a_mutations=request.mecAMutations,
            pbp2a_mutations=request.pbp2aMutations,
            sccmec_type=request.sccmecType,
            additional_genes=request.additionalGenes,
            strain_info=request.strainInfo
        )
        
        # Save to database
        db = get_db()
        prediction_id = db.add_prediction({
            'type': 'oxacillin',
            'input': {
                'mecAMutations': request.mecAMutations,
                'pbp2aMutations': request.pbp2aMutations,
                'sccmecType': request.sccmecType,
                'additionalGenes': request.additionalGenes,
                'strainInfo': request.strainInfo
            },
            'output': result
        })
        
        return PredictionResponse(
            type='oxacillin',
            input=request.dict(),
            output=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oxacillin prediction failed: {str(e)}")


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


@app.get("/api/models")
async def list_models():
    """List available ML models and their descriptions."""
    return {
        "models": [
            {
                "id": "bayesian",
                "name": "Bayesian Network Model",
                "description": "AI-powered Bayesian network for resistance probability estimation",
                "antibiotics": ["oxacillin", "vancomycin", "ceftaroline"],
                "features": ["mutation_analysis", "frequency_integration", "ai_rationale"]
            },
            {
                "id": "evolutionary",
                "name": "Evolutionary Resistance Predictor",
                "description": "Models evolutionary trajectories of resistance emergence",
                "antibiotics": ["general_resistance"],
                "features": ["trajectory_modeling", "co_occurrence_analysis", "intervention_suggestions"]
            },
            {
                "id": "svm",
                "name": "Support Vector Machine",
                "description": "SVM classifier trained on MRSA resistance data",
                "antibiotics": ["oxacillin", "vancomycin", "ceftaroline"],
                "features": ["probability_estimation", "feature_importance"]
            },
            {
                "id": "random_forest",
                "name": "Random Forest",
                "description": "Random Forest classifier with 100 decision trees",
                "antibiotics": ["oxacillin", "vancomycin", "ceftaroline"],
                "features": ["probability_estimation", "feature_importance", "tree_ensemble"]
            },
            {
                "id": "ensemble",
                "name": "Ensemble Model",
                "description": "Combined SVM + Random Forest for robust predictions",
                "antibiotics": ["oxacillin", "vancomycin", "ceftaroline"],
                "features": ["weighted_averaging", "model_comparison", "high_confidence"]
            },
            {
                "id": "oxacillin",
                "name": "Oxacillin Specialist",
                "description": "Specialized model for oxacillin resistance with SCCmec analysis",
                "antibiotics": ["oxacillin"],
                "features": ["sccmec_analysis", "high_risk_mutation_detection", "strain_classification"]
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
