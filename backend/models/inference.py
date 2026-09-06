# models/inference.py

def calculate_landslide_risk(rainfall_mm: float, slope_deg: float, soil_moisture_pct: float) -> dict:
    """
    Evaluates physical landslide hazard level using geotechnical parameters:
    1. Rainfall intensity (mm over 24h)
    2. Slope steepness (degrees)
    3. Soil saturation percentage
    """
    # Normalized risk weight matrices
    rain_weight = min(1.0, rainfall_mm / 150.0) * 0.45
    slope_weight = min(1.0, slope_deg / 45.0) * 0.35
    moisture_weight = (soil_moisture_pct / 100.0) * 0.20
    
    risk_score = round((rain_weight + slope_weight + moisture_weight) * 100, 2)
    
    if risk_score >= 75:
        severity = "RED ALERT (CRITICAL)"
        action = "Issue immediate evacuation orders & notify district disaster management authority."
        trigger_sos = True
    elif risk_score >= 45:
        severity = "ORANGE WARNING (HIGH)"
        action = "Monitor slope movement sensors & restrict heavy highway traffic."
        trigger_sos = False
    else:
        severity = "GREEN (STABLE)"
        action = "Routine environmental monitoring."
        trigger_sos = False

    return {
        "risk_score": risk_score,
        "severity": severity,
        "recommended_action": action,
        "trigger_sos": trigger_sos,
        "telemetry": {
            "rainfall_mm": rainfall_mm,
            "slope_deg": slope_deg,
            "soil_moisture_pct": soil_moisture_pct
        }
    }
