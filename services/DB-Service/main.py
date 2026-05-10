from fastapi import FastAPI
from database import db

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "status": "API Online",
        "message": "WELCOME TO API",
        "docs_url": "http://127.0.0"
    }

@app.get("/health")
def read_root():
    return {
            "status": "true"
        }

@app.post("/road-incidents")
def save_road_incident(data: dict):
    db.road_incidents.insert_one({
        "image_url": data.get("image_url"),
        "gps": data.get("gps"), 
        "timestamp": data.get("timestamp"),
        "type_of_damage": data.get("type_of_damage"),
        "num_of_potholes": data.get("num_of_potholes"),
        "num_of_signals": data.get("num_of_signals")
    })

    return {"message": "Road incidence saved successfully!"}

