from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database import db

app = FastAPI(title="Ingestion API")

class RoadIncident(BaseModel):
    image_url: Optional[str] = None
    gps: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None
    type_of_damage: Optional[str] = None
    num_of_potholes: Optional[int] = 0
    num_of_signals: Optional[int] = 0

@app.get("/")
def read_root():
    return {
        "status": "API Online",
        "message": "WELCOME TO API",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {
            "status": "true"
        }

@app.post("/road-incidents")
def save_road_incident(data: RoadIncident):
    try:
        result = db.road_incidents.insert_one(data.model_dump())
        return {
            "message": "Road incident saved successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
