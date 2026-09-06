import math

def calculate_landslide_risk(rainfall_mm: float, slope_deg: float, soil_moisture: float) -> dict:
    """
    Calculates a heuristic hazard risk score for landslide probability.
    """
    # Normalized weights
    rain_factor = min(rainfall_mm / 150.0, 1.0) * 0.4
    slope_factor = min(slope_deg / 60.0, 1.0) * 0.4
    moisture_factor = min(soil_moisture / 100.0, 1.0) * 0.2

    score = round((rain_factor + slope_factor + moisture_factor) * 100, 1)

    if score > 75:
        level = "CRITICAL"
        action = "Immediate evacuation to higher/stable ground recommended."
    elif score > 45:
        level = "WARNING"
        action = "Monitor local alerts; prepare emergency supplies."
    else:
        level = "SAFE"
        action = "Conditions normal. Stay informed."

    return {
        "risk_score": score,
        "hazard_level": level,
        "recommended_action": action
    }