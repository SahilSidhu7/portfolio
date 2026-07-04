import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

import generation  # noqa: E402
import retrieval  # noqa: E402

STORE_DIR = os.getenv("STORE_DIR", "store")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # public embeddable widget
    allow_credentials=False,  # no cookies/auth on this API
    allow_methods=["*"],
    allow_headers=["*"],
)

_store = None


def get_store() -> retrieval.Store:
    global _store
    if _store is None:
        _store = retrieval.Store.load(STORE_DIR)
    return _store


class ChatRequest(BaseModel):
    question: str


def retrieve(question: str):
    """Hybrid search + rerank + gate. Returns (chunks, sources) or (None, []) when gated."""
    store = get_store()
    candidates = retrieval.search(store, question)
    ranked = retrieval.rerank(question, candidates)
    confident = retrieval.passes_gate(ranked)
    lexical = retrieval.bm25_top(store, question) >= retrieval.MIN_BM25_SCORE
    if not (confident or lexical):
        return None, []
    chunks = [c for c, _ in ranked]
    sources = list(dict.fromkeys(c["source"] for c in chunks))
    return chunks, sources


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        chunks, sources = retrieve(req.question)
    except Exception:
        return {"answer": generation.UNAVAILABLE, "sources": []}
    if chunks is None:
        return {"answer": generation.REFUSAL, "sources": []}
    try:
        text = generation.answer(generation.build_prompt(req.question, chunks))
    except Exception:
        return {"answer": generation.UNAVAILABLE, "sources": []}
    return {"answer": text, "sources": sources}


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    try:
        chunks, sources = retrieve(req.question)
    except Exception:
        def sse_unavailable():
            yield f"data: {json.dumps({'delta': generation.UNAVAILABLE})}\n\n"
            yield f"data: {json.dumps({'done': True, 'sources': []})}\n\n"

        return StreamingResponse(sse_unavailable(), media_type="text/event-stream")

    def sse():
        if chunks is None:
            yield f"data: {json.dumps({'delta': generation.REFUSAL})}\n\n"
            yield f"data: {json.dumps({'done': True, 'sources': []})}\n\n"
            return
        try:
            for delta in generation.stream_answer(generation.build_prompt(req.question, chunks)):
                yield f"data: {json.dumps({'delta': delta})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'delta': generation.UNAVAILABLE})}\n\n"
        yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"

    return StreamingResponse(sse(), media_type="text/event-stream")
