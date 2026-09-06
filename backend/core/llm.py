# core/llm.py
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AISTUDIO_API_KEY = os.getenv("AISTUDIO_API_KEY", "").strip()


async def _call_gemini_api(prompt: str, key: str) -> str:
    # Supported v1beta endpoints for Google AI Studio
    models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    last_error = ""

    for model_name in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 300
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        return candidates[0]["content"]["parts"][0]["text"]
                
                last_error = f"Model '{model_name}' Status {res.status_code}: {res.text}"
                print(f"[Gemini REST Error]: {last_error}")
        except Exception as err:
            last_error = str(err)
            print(f"[Gemini Network Error]: {last_error}")

    raise Exception(f"All Gemini models failed. Last error: {last_error}")

async def _call_openai_api(prompt: str, key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
    raise Exception(f"OpenAI Status {res.status_code}")


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    clean_msg = prompt.strip().lower()

    # Fast-Path for greetings
    if clean_msg in ["hi", "hello", "hey", "namaste", "hola", "start"]:
        if target_language.lower().startswith("hin"):
            return "नमस्ते! मैं SixSense आपदा सहायता बॉट हूँ। आप सुरक्षित स्थान पर हैं या आपको सहायता की आवश्यकता है?"
        return "Hello! I am SixSense Emergency Assistant. Are you in a safe location, or do you require immediate disaster response assistance?"

    system_context = (
        f"You are SixSense AI, an empathetic disaster assistant and emergency safety guide.\n"
        f"RULES:\n"
        f"1. Address the user's situation directly with calm empathy.\n"
        f"2. For medical questions (e.g., punctured arterial wall, bleeding, fractures), explain clearly in simple terms and give direct first-aid instructions (e.g. apply firm direct pressure, do not remove embedded objects, elevate if possible).\n"
        f"3. Always list primary emergency numbers (NDMA 1078 | Emergency 112 | Ambulance 102).\n"
        f"4. Respond in {target_language}.\n"
        f"5. Keep responses concise and scannable."
    )

    if context_data:
        system_context += f"\nActive Telemetry: {context_data}"

    full_prompt = f"{system_context}\n\nUser Question: {prompt}"

    # Tier 1: Primary Gemini Key
    if GEMINI_API_KEY:
        try:
            return await _call_gemini_api(full_prompt, GEMINI_API_KEY)
        except Exception as e:
            gemini_err = str(e)

    # Tier 2: OpenAI Key
    if OPENAI_API_KEY:
        try:
            return await _call_openai_api(full_prompt, OPENAI_API_KEY)
        except Exception as e:
            pass

    # Tier 3: Secondary AI Studio Key
    if AISTUDIO_API_KEY:
        try:
            return await _call_gemini_api(full_prompt, AISTUDIO_API_KEY)
        except Exception as e:
            pass

    # Dynamic Error Return (Exposes exact API response error if Gemini fails)
    return (
        f"⚠️ **Gemini REST API Error Details:**\n`{gemini_err}`\n\n"
        f"--- Emergency Directives ---\n"
        f"If dealing with an arterial puncture/severe bleeding:\n"
        f"1. **Apply Continuous Direct Pressure** using a clean cloth or garment.\n"
        f"2. **Do NOT release pressure** or remove soaked bandages—add more cloth on top.\n"
        f"3. Call **102** (Ambulance) or **112** (Emergency) immediately."
    )