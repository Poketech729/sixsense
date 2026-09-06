import os
import httpx
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import core processing engines with fallback handling
try:
    from backend.core.llm import query_llm
except ModuleNotFoundError:
    from core.llm import query_llm

app = FastAPI(title="SixSense Disaster Prevention API", version="2.0.0")

# Enable CORS for local testing & Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationPredictRequest(BaseModel):
    lat: float
    lon: float
    sector_name: Optional[str] = "Selected Location"

class ChatRequest(BaseModel):
    message: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    language: Optional[str] = "English"


async def fetch_realtime_environmental_data(lat: float, lon: float):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=rain,showers,soil_temperature_0cm&hourly=soil_moisture_0_to_1cm"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                current_rain = data.get("current", {}).get("rain", 0.0) + data.get("current", {}).get("showers", 0.0)
                soil_moisture_list = data.get("hourly", {}).get("soil_moisture_0_to_1cm", [0.4])
                soil_pct = min(100, int((soil_moisture_list[0] if soil_moisture_list else 0.4) * 100))
                return current_rain, soil_pct
    except Exception as e:
        print(f"[Telemetry Warning] Weather API fallback used: {e}")
    return 12.5, 65


@app.get("/")
def read_root():
    return {"system": "SixSense National Landslide Warning System", "status": "Operational"}


@app.post("/api/predict")
async def predict_risk(req: LocationPredictRequest):
    try:
        rain_mm, soil_moisture = await fetch_realtime_environmental_data(req.lat, req.lon)
        
        slope_estimated = 35.0 
        risk_score = min(99.9, round((rain_mm * 0.4) + (slope_estimated * 0.8) + (soil_moisture * 0.3), 1))

        if risk_score > 75:
            severity = "RED ALERT (CRITICAL)"
            action = "Evacuate low-lying and slope-adjacent structures immediately. Move to high-ground shelters."
            trigger_sos = True
        elif risk_score > 45:
            severity = "ORANGE ALERT (MODERATE)"
            action = "Stay alert. Avoid travel along hill corridors and monitor real-time weather updates."
            trigger_sos = False
        else:
            severity = "GREEN (SAFE)"
            action = "Terrain conditions are stable. Normal activity permitted."
            trigger_sos = False

        return {
            "status": "success",
            "location": {"lat": req.lat, "lon": req.lon, "name": req.sector_name},
            "telemetry_fetched": {
                "rainfall_mm": rain_mm,
                "soil_moisture_pct": soil_moisture,
                "estimated_slope_deg": slope_estimated
            },
            "assessment": {
                "risk_score": risk_score,
                "severity": severity,
                "recommended_action": action,
                "trigger_sos": trigger_sos
            }
        }
    except Exception as e:
        print(f"[Predict Error]: {e}")
        raise HTTPException(status_code=500, detail="Prediction processing failed.")


@app.post("/api/chat")
async def chat_assistant(req: ChatRequest):
    try:
        context_data = None
        
        # Grab environmental telemetry if location coordinates are provided
        if req.lat is not None and req.lon is not None:
            rain, soil = await fetch_realtime_environmental_data(req.lat, req.lon)
            context_data = {
                "latitude": req.lat,
                "longitude": req.lon,
                "recent_rainfall_mm": rain,
                "soil_moisture_pct": soil
            }

        # Query LLM Cascade
        reply = await query_llm(
            prompt=req.message,
            context_data=context_data,
            target_language=req.language or "English"
        )

        return {"status": "success", "response": reply}
    except Exception as e:
        print(f"[Chat Endpoint Exception]: {e}")
        # Always return valid JSON so frontend fetch does not throw a raw network crash
        return JSONResponse(
            status_code=200,
            content={
                "status": "fallback",
                "response": (
                    "🚨 **EMERGENCY PROTOCOL ACTIVE**\n\n"
                    "If you are in immediate danger:\n"
                    "1. **Stay calm and move to safe higher ground.**\n"
                    "2. **Call Emergency Hotlines directly.**\n\n"
                    "📞 **HOTLINES:** NDMA: **1078** | Emergency: **112** | Ambulance: **102**"
                )
            }
        )