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
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 200}
    }
    async with httpx.AsyncClient(timeout=4.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        print(f"[Gemini Error Response]: {res.status_code} - {res.text}")
    raise Exception(f"Gemini HTTP {res.status_code}")


async def _call_openai_api(prompt: str, key: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.3
    }
    async with httpx.AsyncClient(timeout=4.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["choices"][0]["message"]["content"]
        print(f"[OpenAI Error Response]: {res.status_code} - {res.text}")
    raise Exception(f"OpenAI HTTP {res.status_code}")


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    clean_msg = prompt.strip().lower()

    # Fast-Path for greetings
    if clean_msg in ["hi", "hello", "hey", "namaste", "hola", "start"]:
        if target_language.lower().startswith("hin"):
            return "नमस्ते! मैं SixSense आपदा सहायता बॉट हूँ। आप सुरक्षित स्थान पर हैं या आपको सहायता की आवश्यकता है?"
        return "Hello! I am SixSense Emergency Assistant. Are you in a safe location, or do you require immediate disaster response assistance?"

    system_context = (
        f"You are SixSense AI, an empathetic disaster assistant and medical triage guide.\n"
        f"RULES:\n"
        f"1. Acknowledge user symptoms directly with empathy (e.g. dizziness, medication, entrapment).\n"
        f"2. Provide direct first-aid advice (e.g. 'Do NOT take painkillers if bleeding or dizzy from head trauma—conserve water and stay still').\n"
        f"3. Always mention Emergency Hotlines (NDMA 1078 | Emergency 112).\n"
        f"4. Respond entirely in {target_language}.\n"
        f"5. Keep responses concise (under 80 words)."
    )

    if context_data:
        system_context += f"\nTelemetry Context: {context_data}"

    full_prompt = f"{system_context}\n\nUser Question: {prompt}"

    # Tier 1: Primary Gemini API
    if GEMINI_API_KEY and len(GEMINI_API_KEY) > 5:
        try:
            return await _call_gemini_api(full_prompt, GEMINI_API_KEY)
        except Exception as e:
            print(f"[Tier 1 Gemini Failed]: {e}")

    # Tier 2: OpenAI
    if OPENAI_API_KEY and len(OPENAI_API_KEY) > 5:
        try:
            return await _call_openai_api(full_prompt, OPENAI_API_KEY)
        except Exception as e:
            print(f"[Tier 2 OpenAI Failed]: {e}")

    # Tier 3: Secondary AI Studio Key
    if AISTUDIO_API_KEY and len(AISTUDIO_API_KEY) > 5:
        try:
            return await _call_gemini_api(full_prompt, AISTUDIO_API_KEY)
        except Exception as e:
            print(f"[Tier 3 AI Studio Failed]: {e}")

    # Dynamic Fallback (If no API keys are loaded in Vercel environment)
    return (
        f"Stay calm. If you are feeling dizzy, **sit or lie down immediately** to prevent injury from falling. "
        f"Do NOT take unprescribed painkillers without medical supervision. "
        f"Call NDMA **1078** or **112** for emergency medical dispatch."
    )