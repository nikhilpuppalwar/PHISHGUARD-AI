import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.meta import LLMCredential

# Catalog of supported providers and default recommended models
PROVIDER_CATALOG = {
    "gemini": {
        "name": "Google Gemini",
        "default_model": "gemini-2.0-flash",
        "models": ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
        "requires_key": True,
        "description": "Google DeepMind high-speed multimodal models with rich reasoning."
    },
    "groq": {
        "name": "Groq",
        "default_model": "llama-3.3-70b-versatile",
        "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
        "base_url": "https://api.groq.com/openai/v1",
        "requires_key": True,
        "description": "Ultra-low-latency LPU inference for Meta Llama and Mixtral."
    },
    "openrouter": {
        "name": "OpenRouter",
        "default_model": "anthropic/claude-3.5-sonnet",
        "models": [
            "anthropic/claude-3.5-sonnet",
            "meta-llama/llama-3.3-70b-instruct",
            "deepseek/deepseek-r1",
            "google/gemini-2.0-flash-exp:free"
        ],
        "base_url": "https://openrouter.ai/api/v1",
        "requires_key": True,
        "description": "Unified gateway to Claude, DeepSeek, Llama, and Gemini models."
    },
    "claude": {
        "name": "Anthropic Claude",
        "default_model": "claude-3-5-sonnet-20241022",
        "models": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
        "base_url": "https://api.anthropic.com/v1",
        "requires_key": True,
        "description": "State-of-the-art security analysis and reasoning from Anthropic."
    },
    "openai": {
        "name": "ChatGPT / OpenAI",
        "default_model": "gpt-4o-mini",
        "models": ["gpt-4o", "gpt-4o-mini", "o1-mini"],
        "base_url": "https://api.openai.com/v1",
        "requires_key": True,
        "description": "OpenAI flagship models with structured JSON outputs."
    },
    "ollama": {
        "name": "Ollama (Local LLM)",
        "default_model": "llama3.2",
        "models": ["llama3.2", "llama3", "mistral", "gemma2", "phi3"],
        "base_url": "http://localhost:11434",
        "requires_key": False,
        "description": "Local, completely offline, zero-data-leakage open source LLMs."
    },
    "huggingface": {
        "name": "Hugging Face Inference",
        "default_model": "meta-llama/Llama-3.2-3B-Instruct",
        "models": ["meta-llama/Llama-3.2-3B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
        "base_url": "https://api-inference.huggingface.co/models",
        "requires_key": True,
        "description": "Direct serverless inference on open weights models."
    }
}

class LLMGateway:
    def get_active_credential(self, db: Session) -> Optional[LLMCredential]:
        """Fetch the currently active saved credential from the database."""
        cred = db.query(LLMCredential).filter(LLMCredential.is_active == True).order_by(LLMCredential.updated_at.desc()).first()
        return cred

    def test_connection(self, provider: str, model_name: str, api_key: Optional[str], base_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Actively ping the provider's API with a test prompt and measure round-trip latency.
        """
        start_time = time.time()
        test_prompt = "Hello! Please respond with exactly: 'PhishGuard AI Connected Successfully!'"

        provider = provider.lower().strip()
        cat = PROVIDER_CATALOG.get(provider, {})

        try:
            # 1. Google Gemini
            if provider == "gemini":
                if not api_key:
                    return {"success": False, "error": "Gemini API key is required"}
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                m = genai.GenerativeModel(model_name or "gemini-1.5-flash")
                resp = m.generate_content("Respond with exactly: 'PhishGuard AI Connected Successfully!'")
                latency_ms = round((time.time() - start_time) * 1000)
                text = resp.text.strip() if resp and resp.text else "Connection confirmed!"
                return {
                    "success": True,
                    "provider": "gemini",
                    "model": model_name,
                    "latency_ms": latency_ms,
                    "response": text
                }

            # 2. OpenAI-compatible providers: Groq, OpenRouter, OpenAI
            elif provider in ["groq", "openrouter", "openai"]:
                if not api_key:
                    return {"success": False, "error": f"{cat.get('name', provider)} API key is required"}

                api_base = (base_url or cat.get("base_url") or "https://api.openai.com/v1").rstrip("/")
                endpoint = f"{api_base}/chat/completions"

                payload = {
                    "model": model_name or cat.get("default_model"),
                    "messages": [{"role": "user", "content": test_prompt}],
                    "max_tokens": 40
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                if provider == "openrouter":
                    headers["HTTP-Referer"] = "http://localhost:5173"
                    headers["X-Title"] = "PhishGuard AI"

                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=12) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    latency_ms = round((time.time() - start_time) * 1000)
                    reply = data["choices"][0]["message"]["content"].strip()
                    return {
                        "success": True,
                        "provider": provider,
                        "model": model_name,
                        "latency_ms": latency_ms,
                        "response": reply
                    }

            # 3. Anthropic Claude
            elif provider == "claude":
                if not api_key:
                    return {"success": False, "error": "Anthropic Claude API key is required"}
                endpoint = "https://api.anthropic.com/v1/messages"
                payload = {
                    "model": model_name or "claude-3-5-haiku-20241022",
                    "max_tokens": 40,
                    "messages": [{"role": "user", "content": test_prompt}]
                }
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=12) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    latency_ms = round((time.time() - start_time) * 1000)
                    reply = data["content"][0]["text"].strip()
                    return {
                        "success": True,
                        "provider": "claude",
                        "model": model_name,
                        "latency_ms": latency_ms,
                        "response": reply
                    }

            # 4. Ollama (Local)
            elif provider == "ollama":
                host = (base_url or "http://localhost:11434").rstrip("/")
                endpoint = f"{host}/api/generate"
                payload = {
                    "model": model_name or "llama3.2",
                    "prompt": test_prompt,
                    "stream": False
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=8) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    latency_ms = round((time.time() - start_time) * 1000)
                    reply = data.get("response", "Ollama connected!").strip()
                    return {
                        "success": True,
                        "provider": "ollama",
                        "model": model_name,
                        "latency_ms": latency_ms,
                        "response": reply
                    }

            # 5. Hugging Face
            elif provider == "huggingface":
                if not api_key:
                    return {"success": False, "error": "Hugging Face API token is required"}
                m_target = model_name or "meta-llama/Llama-3.2-3B-Instruct"
                endpoint = f"https://api-inference.huggingface.co/models/{m_target}"
                payload = {"inputs": test_prompt, "parameters": {"max_new_tokens": 40}}
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=12) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    latency_ms = round((time.time() - start_time) * 1000)
                    reply = str(data[0].get("generated_text", "HF connected!")) if isinstance(data, list) else str(data)
                    return {
                        "success": True,
                        "provider": "huggingface",
                        "model": model_name,
                        "latency_ms": latency_ms,
                        "response": reply
                    }

            else:
                return {"success": False, "error": f"Unknown provider: {provider}"}

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            return {"success": False, "error": f"HTTP {e.code}: {err_body[:200]}"}
        except Exception as ex:
            return {"success": False, "error": str(ex)}

    def generate_chat(self, db: Session, messages: List[Dict[str, str]], system_prompt: str = "") -> Optional[str]:
        """
        Execute live inference using whichever LLM credential is currently active in the database.
        Returns None if no active credential or if call fails, allowing automatic fallback.
        """
        cred = self.get_active_credential(db)
        if not cred or not cred.api_key and cred.provider != "ollama":
            # Fall back to environment keys if set
            if settings.GEMINI_API_KEY:
                cred = LLMCredential(provider="gemini", model_name="gemini-2.0-flash", api_key=settings.GEMINI_API_KEY)
            elif settings.OPENAI_API_KEY:
                cred = LLMCredential(provider="openai", model_name="gpt-4o-mini", api_key=settings.OPENAI_API_KEY)
            else:
                return None

        provider = cred.provider.lower()
        model_name = cred.model_name
        api_key = cred.api_key

        try:
            if provider == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                m = genai.GenerativeModel(
                    model_name or "gemini-2.0-flash",
                    system_instruction=system_prompt if system_prompt else None
                )
                # Format conversation history
                history_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
                resp = m.generate_content(history_text)
                return resp.text.strip()

            elif provider in ["groq", "openrouter", "openai"]:
                api_base = (cred.base_url or PROVIDER_CATALOG.get(provider, {}).get("base_url") or "https://api.openai.com/v1").rstrip("/")
                endpoint = f"{api_base}/chat/completions"

                api_msgs = []
                if system_prompt:
                    api_msgs.append({"role": "system", "content": system_prompt})
                api_msgs.extend(messages)

                payload = {
                    "model": model_name,
                    "messages": api_msgs,
                    "temperature": 0.4,
                    "max_tokens": 500
                }
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
                if provider == "openrouter":
                    headers["HTTP-Referer"] = "http://localhost:5173"
                    headers["X-Title"] = "PhishGuard AI"

                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=15) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    return data["choices"][0]["message"]["content"].strip()

            elif provider == "ollama":
                host = (cred.base_url or "http://localhost:11434").rstrip("/")
                endpoint = f"{host}/api/chat"
                api_msgs = []
                if system_prompt:
                    api_msgs.append({"role": "system", "content": system_prompt})
                api_msgs.extend(messages)
                payload = {
                    "model": model_name,
                    "messages": api_msgs,
                    "stream": False
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(req, timeout=12) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    return data["message"]["content"].strip()

        except Exception as e:
            print(f"LLM Gateway Error calling {provider}: {e}")
            return None

        return None

llm_gateway = LLMGateway()
