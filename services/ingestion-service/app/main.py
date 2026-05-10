import json

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from starlette.datastructures import UploadFile
from typing import Optional, Any
from app.database import db
from app.storage import object_storage

app = FastAPI(title="Ingestion API")

class RoadIncident(BaseModel):
    image_url: Optional[str] = None
    gps: Optional[Any] = None
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
async def save_road_incident(request: Request):
    try:
        content_type = request.headers.get("content-type", "")
        document = await _parse_road_incident(request, content_type)

        result = db.road_incidents.insert_one(document)
        return {
            "message": "Road incident saved successfully",
            "id": str(result.inserted_id)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _parse_road_incident(request: Request, content_type: str) -> dict[str, Any]:
    if content_type.startswith("application/json"):
        payload = RoadIncident.model_validate(await request.json())
        document = payload.model_dump()

        if document.get("image_url"):
            document["image_url"] = object_storage.upload_image(document["image_url"])

        return document

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        document = RoadIncident(
            image_url=_get_optional_str(form.get("image_url")),
            gps=_parse_gps(form.get("gps")),
            timestamp=_get_optional_str(form.get("timestamp")),
            type_of_damage=_get_optional_str(form.get("type_of_damage")),
            num_of_potholes=_parse_optional_int(form.get("num_of_potholes"), default=0),
            num_of_signals=_parse_optional_int(form.get("num_of_signals"), default=0),
        ).model_dump()

        image = form.get("image")
        if isinstance(image, UploadFile) and image.filename:
            image_bytes = await image.read()
            await image.close()
            document["image_url"] = object_storage.upload_file(
                image_bytes,
                content_type=image.content_type,
                filename=image.filename,
            )
        elif document["image_url"]:
            document["image_url"] = object_storage.upload_image(document["image_url"])

        return document

    raise ValueError("Unsupported content type. Use application/json or multipart/form-data")


def _get_optional_str(value: Any) -> Optional[str]:
    if value is None:
        return None

    normalized = str(value).strip()
    return normalized or None


def _parse_optional_int(value: Any, default: int = 0) -> Optional[int]:
    if value is None or str(value).strip() == "":
        return default

    return int(value)


def _parse_gps(value: Any) -> Any:
    normalized = _get_optional_str(value)
    if normalized is None:
        return None

    if normalized.startswith("{") or normalized.startswith("["):
        try:
            return json.loads(normalized)
        except json.JSONDecodeError:
            pass

    return normalized
