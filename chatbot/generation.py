import json
import os

import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", os.getenv("ollama_url", "http://localhost:11434"))
GEN_MODEL = os.getenv("GEN_MODEL", "qwen3:1.7b")

REFUSAL = "I couldn't find that information on this website."
UNAVAILABLE = "The assistant is currently unavailable."


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(c["text"] for c in chunks)
    return f"""You are the assistant for this website. Answer the visitor's question using ONLY the website information below.

Rules:
- 2-4 sentences for simple questions; a bullet list only for 3+ distinct items.
- No headers, no bold, no sign-offs, no filler.
- Say "we" and "our" for the site owner.
- If the information below does not contain the answer, reply exactly: {REFUSAL}

Website information:
{context}

Visitor question: {question}

Answer:"""


def stream_answer(prompt: str, model: str | None = None, url: str | None = None):
    """Yield text deltas from Ollama's streaming generate API."""
    payload = {
        "model": model or GEN_MODEL,
        "prompt": prompt,
        "stream": True,
        "think": False,
        "options": {"num_predict": 300, "temperature": 0.2, "top_p": 0.9},
    }
    with requests.post(f"{url or OLLAMA_URL}/api/generate", json=payload, stream=True, timeout=120) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            data = json.loads(line)
            delta = data.get("response", "")
            if delta:
                yield delta
            if data.get("done"):
                break


def answer(prompt: str, model: str | None = None, url: str | None = None) -> str:
    return "".join(stream_answer(prompt, model=model, url=url))
