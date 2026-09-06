# core/llm.py
import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI

load_dotenv()

# Environment Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AISTUDIO_API_KEY = os.getenv("AISTUDIO_API_KEY", "").strip()


def _call_gemini_sync(full_prompt: str, key: str) -> str:
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(full_prompt)
    return response.text


def _call_openai_sync(full_prompt: str, key: str) -> str:
    client = OpenAI(api_key=key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": full_prompt}],
        max_tokens=250,
        temperature=0.7,
    )
    return response.choices[0].message.content


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    system_context = (
        "You are SixSense AI, an empathetic disaster assistant and emergency safety guide (SIH26001).\n\n"
        "RESPONSE RULES:\n"
        "1. DO NOT give robotic template responses or repeat 'Hi' when someone is in distress.\n"
        "2. For distress or emergency calls, speak with calm empathy, give 2 immediate physical survival steps, "
        "and provide hotlines (NDMA 1078 | Emergency 112 | Ambulance 102).\n"
        f"3. Language Requirement: Respond entirely in {target_language}.\n"
        "4. Keep responses direct, clear, and concise for low-bandwidth screens."
    )

    if context_data:
        system_context += f"\nActive Telemetry Context: {context_data}"

    full_prompt = f"{system_context}\n\nUser Query: {prompt}"

    # Tier 1: Primary Gemini API Key
    if GEMINI_API_KEY and len(GEMINI_API_KEY) > 10:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(_call_gemini_sync, full_prompt, GEMINI_API_KEY),
                timeout=6.0
            )
        except Exception as e:
            print(f"[Tier 1 - Primary Gemini Failed]: {e}")

    # Tier 2: OpenAI API Key (GPT-4o-mini)
    if OPENAI_API_KEY and len(OPENAI_API_KEY) > 10:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(_call_openai_sync, full_prompt, OPENAI_API_KEY),
                timeout=6.0
            )
        except Exception as e:
            print(f"[Tier 2 - OpenAI Failed]: {e}")

    # Tier 3: Secondary AI Studio Gemini Key
    if AISTUDIO_API_KEY and len(AISTUDIO_API_KEY) > 10:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(_call_gemini_sync, full_prompt, AISTUDIO_API_KEY),
                timeout=6.0
            )
        except Exception as e:
            print(f"[Tier 3 - Secondary AI Studio Gemini Failed]: {e}")

    # Tier 4: Fail-safe Static Response (If all 3 cloud APIs fail)
    return (
        "🚨 **EMERGENCY PROTOCOL ACTIVE**\n\n"
        "Please remain calm. If you are trapped, injured, or in immediate danger:\n"
        "1. **Conserve Energy:** Stay still and cover your nose and mouth if dust is present.\n"
        "2. **Signal for Help:** Tap rhythmically on pipes or walls so rescuers can locate you.\n\n"
        "📞 **IMMEDIATE HOTLINES:**\n"
        "• **NDMA Helpline:** 1078\n"
        "• **National Emergency:** 112\n"
        "• **Ambulance:** 102"
    )