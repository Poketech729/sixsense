# core/llm.py
import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
USE_LOCAL_OLLAMA = os.getenv("USE_LOCAL_OLLAMA", "false").lower() == "true"


def _call_gemini_sync(full_prompt: str, api_key: str) -> str:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(full_prompt)
    return response.text


async def query_llm(prompt: str, context_data: dict = None, target_language: str = "English") -> str:
    """
    Non-blocking hybrid router:
    1. Local Ollama (if configured)
    2. Cloud Gemini 1.5 Flash (via thread executor with timeout)
    3. Empathetic Fallback Protocol if offline or key fails
    """
    system_context = (
        "You are SixSense AI, an empathetic disaster assistant and early warning safety guide "
        "for landslide risks (SIH26001).\n\n"
        "CRITICAL RESPONSE DIRECTIVES:\n"
        "1. DO NOT output canned template greetings (e.g., 'Hi, how can I help?') when a user is in distress, trapped, or injured.\n"
        "2. If the user reports physical entrapment, injury, or extreme danger:\n"
        "   - Speak with immediate empathy, calm reassurance, and clear direction.\n"
        "   - Give 2 concise physical survival steps (e.g., conserve oxygen, stay still, tap rhythmically on metal/pipes).\n"
        "   - Always provide official emergency hotlines: NDMA 1078 | National Emergency 112 | Ambulance 102.\n"
        f"3. Language Requirement: Respond entirely in {target_language}.\n"
        "4. Keep responses brief, actionable, and formatted cleanly for mobile screens."
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
    if GEMINI_API_KEY and GEMINI_API_KEY.strip() != "":
        try:
            answer = await asyncio.wait_for(
                asyncio.to_thread(_call_gemini_sync, full_prompt, GEMINI_API_KEY),
                timeout=8.0
            )
            return answer
        except asyncio.TimeoutError:
            pass  # Fallback to safety protocol on timeout
        except Exception as e:
            print(f"[SixSense LLM Error]: {str(e)}")

    # 3. Empathetic Fail-safe response if offline or key is missing
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