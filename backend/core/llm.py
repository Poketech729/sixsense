# core/llm.py
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
USE_LOCAL_OLLAMA = os.getenv("USE_LOCAL_OLLAMA", "false").lower() == "true"

def _call_gemini_sync(full_prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key="GEMINI_API_KEY")
    # Using gemini-1.5-flash (fastest standard inference model)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(full_prompt)
    return response.text

async def query_llm(prompt: str, context_data: dict = None) -> str:
    """
    Non-blocking hybrid router:
    1. Local Ollama (if configured)
    2. Cloud Gemini (via thread executor with timeout)
    3. Safe Fallback Response if internet/key fails
    """
    system_context = (
        "You are SixSense AI, an early warning system assistant for landslide risks "
        "in the North Eastern Region of India (SIH26001). Provide concise, authoritative, "
        "and actionable disaster-management guidance."
    )
    
    if context_data:
        system_context += f"\nActive Telemetry & Hazard Context: {context_data}"

    full_prompt = f"{system_context}\n\nUser Question: {prompt}"

    # 1. Local Ollama Path
    if USE_LOCAL_OLLAMA:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "llama3",
                        "prompt": full_prompt,
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    return res.json().get("response", "No response generated.")
        except Exception:
            pass  # Fallback to Gemini if Ollama isn't running

    # 2. Non-blocking Cloud Gemini Path with strict 8s Timeout
    if GEMINI_API_KEY and GEMINI_API_KEY != "GEMINI_API_KEY":
        try:
            # Runs synchronous Gemini SDK in a separate thread pool so Uvicorn never freezes
            answer = await asyncio.wait_for(
                asyncio.to_thread(_call_gemini_sync, full_prompt),
                timeout=8.0
            )
            return answer
        except asyncio.TimeoutError:
            return "Gemini API timed out. Defaulting to local safety guidelines."
        except Exception as e:
            return f"LLM Routing Error: {str(e)}"

    # 3. Fail-safe deterministic response if no key is provided
    return (
        "SIH26001 Protocol: Under high risk conditions, activate immediate district-level "
        "evacuation along vulnerable slope corridors, close high-risk transit segments, "
        "and establish direct communication with emergency response teams."
    )
