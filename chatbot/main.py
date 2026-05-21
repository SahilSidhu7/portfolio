from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi.staticfiles import StaticFiles

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings

load_dotenv()

OLLAMA_URL = os.getenv("ollama_url")
MODEL = os.getenv("model")
GEMINI_API_KEY = os.getenv("gemini_api_key")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str


# load embeddings
embeddings = OllamaEmbeddings(model=MODEL, base_url=OLLAMA_URL)

# load vector database
db = FAISS.load_local("vectorstore", embeddings, allow_dangerous_deserialization=True)


def get_llm_response(prompt: str) -> str:
    """Try Gemini API first, fall back to Ollama if it fails."""
    
    # Try Gemini 2.0 Flash first
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=250,
                    temperature=0.2,
                    top_p=0.9,
                )
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
    
    # Fall back to Ollama
    try:
        payload = {
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 250,
                "temperature": 0.2,
                "top_p": 0.9
            }
        }
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=30)
        r.raise_for_status()
        answer = r.json().get("response", "")
        return answer
    except Exception as e:
        print(f"Ollama fallback error: {e}")
        return "The assistant is currently unavailable."


@app.post("/chat")
def chat(req: ChatRequest):

    question = req.question

    results = db.similarity_search_with_score(question, k=5)

    docs = [doc for doc, score in results if score < 1.5]

    context = "\n\n".join(
        f"Source: {d.metadata.get('source','')}\n{d.page_content}"
        for d in docs
    )

    prompt = f"""You are a helpful assistant for this portfolio website. Answer visitor questions using ONLY the website information provided below.

Rules:
- Answer in 2-4 sentences maximum for simple questions
- Only use a bullet list if there are 3+ distinct items to show
- Never use headers, bold text, or ### formatting
- Never use filler phrases or sign-offs
- Use "we" and "our" when referring to the team
- If the answer is not in the website information, respond exactly: "I couldn't find that information on this website."

Website information:
{context}

Visitor question: {question}

Answer (be brief and direct):"""

    answer = get_llm_response(prompt)

    sources = list({d.metadata.get("source") for d in docs if d.metadata.get("source")})

    return {"answer": answer,
            "sources": sources}