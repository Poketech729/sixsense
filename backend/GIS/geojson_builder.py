# GIS/geojson_builder.py

def build_risk_geojson(sector_name: str, lat: float, lon: float, risk_data: dict) -> dict:
    """
    Constructs a GeoJSON Feature Collection representing a hazard zone feature on interactive maps.
    """
    severity = risk_data.get("severity", "GREEN (STABLE)")
    
    # Assign map display color based on severity
    color = "#22c55e" # Green
    if "RED" in severity:
        color = "#ef4444" # Red
    elif "ORANGE" in severity:
        color = "#f97316" # Orange

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "properties": {
                    "sector_name": sector_name,
                    "risk_score": risk_data.get("risk_score"),
                    "severity": severity,
                    "marker_color": color,
                    "recommended_action": risk_data.get("recommended_action"),
                    "telemetry": risk_data.get("telemetry")
                }
            }
        ]
    }
