import os
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Resolve path to backend/.env explicitly
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

REGIONAL_HOTLINES = "NDMA: 1078, Emergency: 112, Police: 100, Ambulance: 102"


async def _call_gemini_api(prompt: str, system_instruction: str, key: str) -> str:
    """Calls Gemini REST API using v1beta endpoint with gemini-2.5-flash."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048
        }
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        
        error_detail = f"Status {res.status_code}: {res.text}"
        print(f"\n[Gemini REST Error Detail] {error_detail}\n")
        raise RuntimeError(f"Gemini API call failed -> {error_detail}")


async def _call_openai_api(prompt: str, system_instruction: str, key: str) -> str:
    """Fallback handler for OpenAI gpt-4o-mini."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.2
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
            
        error_detail = f"Status {res.status_code}: {res.text}"
        print(f"\n[OpenAI Error Detail] {error_detail}\n")
        raise RuntimeError(f"OpenAI API call failed -> {error_detail}")


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    """Unified entry point for backend chat processing."""
    clean_msg = prompt.strip().lower()

    # Fast path for common greetings
    if clean_msg in ["hi", "hello", "hey", "namaste", "hola", "start"]:
        if target_language.lower().startswith("hin"):
            return "नमस्ते! मैं SixSense आपदा सहायता बॉट हूँ। आप सुरक्षित स्थान पर हैं या आपको सहायता की आवश्यकता है?"
        return "Hello! I am SixSense Emergency Assistant. Are you in a safe location, or do you require immediate disaster response assistance?"

    system_instruction = (
        f"You are SixSense AI, an empathetic, highly responsive emergency and survival assistant.\n"
        f"CORE DIRECTIVE:\n"
        f"1. Fulfill ANY user request as long as it pertains to survival, emergency prep, disaster response, first aid, or physical safety.\n"
        f"2. REFUSE immediately and neutrally if the query is completely unrelated to safety, survival, disaster, or health.\n"
        f"3. Provide direct, highly actionable, step-by-step guidance formatted cleanly with bullet points and bold headers.\n"
        f"4. Always include pertinent regional emergency hotlines ({REGIONAL_HOTLINES}).\n"
        f"5. Respond in {target_language}."
    )
    
    if context_data:
        system_instruction += f"\nActive Telemetry Context: {context_data}"

    print(f"[LLM Debug] Key Status -> Gemini: {bool(GEMINI_API_KEY)} | OpenAI: {bool(OPENAI_API_KEY)}")

    # Tier 1: Primary Gemini API
    if GEMINI_API_KEY:
        try:
            return await _call_gemini_api(prompt, system_instruction, GEMINI_API_KEY)
        except Exception as e:
            print(f"[Tier 1 Error - Gemini Primary]: {e}")

    # Tier 2: OpenAI Fallback
    if OPENAI_API_KEY:
        try:
            return await _call_openai_api(prompt, system_instruction, OPENAI_API_KEY)
        except Exception as e:
            print(f"[Tier 3 Error - OpenAI Fallback]: {e}")

    # Tier 3: Emergency Hardcoded Fallback
    return (
        "🚨 **EMERGENCY PROTOCOL ACTIVE**\n\n"
        "If you are in immediate danger:\n"
        "1. **Stay calm and seek safe shelter.**\n"
        "2. **Call Emergency Hotlines directly.**\n\n"
        f"📞 **HOTLINES:** {REGIONAL_HOTLINES}"
    )