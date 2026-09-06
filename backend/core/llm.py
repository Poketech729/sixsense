# core/llm.py
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AISTUDIO_API_KEY = os.getenv("AISTUDIO_API_KEY", "").strip()


async def _call_gemini_api(prompt: str, key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 200}
    }
    async with httpx.AsyncClient(timeout=3.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    raise Exception(f"Gemini API status {res.status_code}")


async def _call_openai_api(prompt: str, key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.4
    }
    async with httpx.AsyncClient(timeout=3.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
    raise Exception(f"OpenAI API status {res.status_code}")


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    clean_msg = prompt.strip().lower()

    # FAST-PATH: Instant local response for greetings (< 5ms response time)
    if clean_msg in ["hi", "hello", "hey", "namaste", "hola", "start"]:
        if target_language.lower().startswith("hin"):
            return "नमस्ते! मैं SixSense आपदा सहायता बॉट हूँ। आप सुरक्षित स्थान पर हैं या आपको सहायता की आवश्यकता है?"
        return "Hello! I am SixSense Emergency Assistant. Are you in a safe location, or do you require immediate disaster response assistance?"

    system_context = (
        f"You are SixSense AI, an empathetic disaster response assistant (SIH26001).\n"
        f"RULES:\n"
        f"1. Give direct, practical safety instructions without generic fluff.\n"
        f"2. For entrapment or injury, give 2 immediate physical survival steps and hotlines (NDMA 1078 | Emergency 112 | Ambulance 102).\n"
        f"3. Language Requirement: Respond entirely in {target_language}.\n"
        f"4. Maximum 80 words."
    )

    if context_data:
        system_context += f"\nActive Telemetry: {context_data}"

    full_prompt = f"{system_context}\n\nUser Query: {prompt}"

    # TIER 1: Primary Gemini API (3s Timeout)
    if GEMINI_API_KEY and len(GEMINI_API_KEY) > 10:
        try:
            return await _call_gemini_api(full_prompt, GEMINI_API_KEY)
        except Exception as e:
            print(f"[Tier 1 Gemini Failed]: {e}")

    # TIER 2: OpenAI GPT-4o-mini (3s Timeout)
    if OPENAI_API_KEY and len(OPENAI_API_KEY) > 10:
        try:
            return await _call_openai_api(full_prompt, OPENAI_API_KEY)
        except Exception as e:
            print(f"[Tier 2 OpenAI Failed]: {e}")

    # TIER 3: Secondary AI Studio Gemini Key (3s Timeout)
    if AISTUDIO_API_KEY and len(AISTUDIO_API_KEY) > 10:
        try:
            return await _call_gemini_api(full_prompt, AISTUDIO_API_KEY)
        except Exception as e:
            print(f"[Tier 3 AI Studio Failed]: {e}")

    # TIER 4: Immediate Fail-Safe Protocol
    return (
        "🚨 **EMERGENCY PROTOCOL ACTIVE**\n\n"
        "If you are trapped or in immediate danger:\n"
        "1. **Conserve Energy:** Stay still and cover your nose and mouth.\n"
        "2. **Signal Rescuers:** Tap rhythmically on pipes or hard structures.\n\n"
        "📞 **HOTLINES:** NDMA: **1078** | Emergency: **112** | Ambulance: **102**"
    )