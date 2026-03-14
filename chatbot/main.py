from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

from fastapi.staticfiles import StaticFiles

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings

load_dotenv()

OLLAMA_URL = os.getenv("ollama_url")
MODEL = os.getenv("model")

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


@app.post("/chat")
def chat(req: ChatRequest):

    question = req.question

    results = db.similarity_search_with_score(question, k=5)

    docs = [doc for doc, score in results if score < 1.5]

    context = "\n\n".join(
        f"Source: {d.metadata.get('source','')}\n{d.page_content}"
        for d in docs
    )

    prompt = f"""
You are the official AI assistant for this website.

You answer questions for visitors using ONLY the website information below.

Guidelines:
- Speak as the website team (use "we", "our").
- Be concise and helpful.
- Format responses in clean markdown.
- Use bullet points when possible.
- Never mention AI models or context retrieval.
- Add proper spacing even in between lines.

If the information is not available in the website data, respond exactly:

"I couldn't find that information on this website."

Website information:
{context}

Visitor question:
{question}

Answer:
"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }

    try:
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload)
        r.raise_for_status()
        answer = r.json().get("response", "")
    except Exception as e:
        answer = "The assistant is currently unavailable."

    sources = list({d.metadata.get("source") for d in docs if d.metadata.get("source")})

    return {"answer": answer,
            "sources": sources}