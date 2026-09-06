import os
import requests
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Configure Gemini client if key is supplied
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def query_ollama(prompt: str, system_prompt: str = "") -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False,
        "options": {
            "num_predict": 256,  # Cap max tokens generated to speed up execution
            "temperature": 0.2    # Lower randomness for faster deterministic responses
        }
    }
    response = requests.post(url, json=payload, timeout=60)
    response.raise_for_status()
    return response.json().get("response", "")

def query_gemini(prompt: str, system_prompt: str = "") -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        raise ValueError("GEMINI_API_KEY is missing in backend/.env file.")
    
    genai.configure(api_key=key)
    
    # Use Gemini 1.5 Flash with search tools enabled
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=system_prompt if system_prompt else None,
        tools=['google_search_retrieval']
    )
    response = model.generate_content(prompt)
    return response.text

def generate_llm_response(prompt: str, system_prompt: str = "") -> dict:
    """
    Unified entrypoint: Tries configured LLM_PROVIDER first.
    Falls back to Gemini if Ollama fails or is offline.
    """
    provider_used = LLM_PROVIDER
    
    if LLM_PROVIDER == "ollama":
        try:
            output = query_ollama(prompt, system_prompt)
            return {"provider": "ollama", "model": OLLAMA_MODEL, "response": output}
        except Exception as e:
            # Fallback to Gemini if configured
            if GEMINI_API_KEY:
                provider_used = "gemini (fallback)"
                output = query_gemini(prompt, system_prompt)
                return {"provider": provider_used, "model": "gemini-1.5-flash", "response": output}
            else:
                raise RuntimeError(f"Ollama failed ({str(e)}) and GEMINI_API_KEY is not set for fallback.")
                
    elif LLM_PROVIDER == "gemini":
        output = query_gemini(prompt, system_prompt)
        return {"provider": "gemini", "model": "gemini-1.5-flash", "response": output}
    
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {LLM_PROVIDER}")
