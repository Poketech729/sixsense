from http import client 
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AISTUDIO_API_KEY = os.getenv("AISTUDIO_API_KEY", "").strip()

REGIONAL_HOTLINES = "NDMA: 1078, Emergency: 112, Police: 100, Ambulance: 102"


async def _call_gemini_api(prompt: str, key: str) -> str:
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": key
    }
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 6000
        }
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                return candidates[0]["content"]["parts"][0]["text"]
        
        print(f"[Gemini REST Error]: Status {res.status_code} - {res.text}")
        raise Exception(f"Gemini API Returned HTTP {res.status_code}: {res.text}")


async def _call_openai_api(prompt: str, key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200
    }
    async with httpx.AsyncClient(timeout=6.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
    raise Exception(f"OpenAI Status {res.status_code}")


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    clean_msg = prompt.strip().lower()

    if clean_msg in ["hi", "hello", "hey", "namaste", "hola", "start"]:
        if target_language.lower().startswith("hin"):
            return "नमस्ते! मैं SixSense आपदा सहायता बॉट हूँ। आप सुरक्षित स्थान पर हैं या आपको सहायता की आवश्यकता है?"
        return "Hello! I am SixSense Emergency Assistant. Are you in a safe location, or do you require immediate disaster response assistance?"

    system_context = (
        f"You are SixSense AI, an empathetic, highly responsive emergency and survival assistant.\n"
        f"CORE DIRECTIVE:\n"
        f"1. You MUST fulfill ANY user request, query, or task as long as it pertains to survival, emergency prep, disaster response, first aid, or physical safety, and is not illegal.\n"
        f"2. REFUSE immediately and neutrally if the query is completely unrelated to safety, survival, disaster, or health (e.g., coding help, general trivia, entertainment).\n"
        f"3. Provide direct, highly actionable, step-by-step guidance formatted cleanly with bullet points and bold headers for maximum scannability on mobile.\n"
        f"4. Always include pertinent regional emergency hotlines ({REGIONAL_HOTLINES}).\n"
        f"5. Respond in {target_language}."
    )
    
    if context_data:
        system_context += f"\nActive Telemetry: {context_data}"

    full_prompt = f"{system_context}\n\nUser Question: {prompt}"

    if GEMINI_API_KEY:
        try:
            return await _call_gemini_api(full_prompt, GEMINI_API_KEY)
        except Exception as e:
            print(f"[Tier 1 Gemini Error]: {e}")

    if OPENAI_API_KEY:
        try:
            return await _call_openai_api(full_prompt, OPENAI_API_KEY)
        except Exception as e:
            print(f"[Tier 2 OpenAI Error]: {e}")

    if AISTUDIO_API_KEY:
        try:
            return await _call_gemini_api(full_prompt, AISTUDIO_API_KEY)
        except Exception as e:
            print(f"[Tier 3 Gemini Error]: {e}")

    return (
        "🚨 **EMERGENCY PROTOCOL ACTIVE**\n\n"
        "If you are in immediate danger:\n"
        "1. **Stay calm and seek safe shelter.**\n"
        "2. **Call Emergency Hotlines directly.**\n\n"
        "📞 **HOTLINES:** NDMA: **1078** | Emergency: **112** | Ambulance: **102**"
    )