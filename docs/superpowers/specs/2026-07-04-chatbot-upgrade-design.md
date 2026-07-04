# Portfolio Chatbot Upgrade — Design Spec

Date: 2026-07-04
Goal: markedly better answers from the embeddable website chatbot using only small, edge-class models (no big/cloud LLMs). This is a freelancing product showcase: privacy-first, zero API keys, runs on Sahil's own server behind Cloudflare.

## Context

Current system (`C:/Portfolio/portfolio/chatbot/`): LangChain + FAISS, `phi3` via Ollama used for BOTH embeddings and generation (chat-model embeddings — the main quality bug), Gemini 2.0 Flash primary with Ollama fallback, Selenium crawler, 1000/200 chunking, k=5 with raw L2 score cutoff. Widget is a 355KB minified React bundle (source not in repo) posting to `POST /chat` → `{answer, sources}`.

Constraints: server is edge-class (~1–2GB budget for models), Ollama is the runtime, English only.

## Architecture

```
question ──► hybrid retrieve ──► rerank ──► confidence gate ──► generate (stream) ──► widget
             FAISS (dense)       FlashRank    threshold on         Ollama qwen3:1.7b     vanilla JS,
             + bm25s (sparse)    top-20→4     rerank score         grounded prompt       SSE render
             fused with RRF
```

### Models (all small, all local)

| Role | Model | Size | Runtime |
|------|-------|------|---------|
| Embeddings | `embeddinggemma` | 300M | Ollama |
| Reranker | FlashRank default (`ms-marco-MiniLM-L-12-v2` ONNX) | ~34MB | CPU, in-process |
| Generation | `qwen3:1.7b` (non-thinking) | ~1.4GB Q4 | Ollama |

Generation model is an env var (`GEN_MODEL`); `gemma3:1b` documented as the low-RAM swap. Embedding model also env (`EMBED_MODEL`).

## Components

**`ingest.py`** (modified, not rewritten)
- Selenium crawler unchanged.
- Chunking: 500 chars / 80 overlap, `RecursiveCharacterTextSplitter` logic replaced by a ~20-line splitter (drop langchain dep); each chunk prefixed with `page title — url` context line.
- Output to `store/`: `chunks.jsonl` (id, text, source, title), `index.faiss` (embeddinggemma vectors via Ollama `/api/embed`, normalized, IndexFlatIP), `bm25s` index directory.

**`retrieval.py`** (new)
- `search(question, k_dense=20, k_sparse=20) -> list[Chunk]`: FAISS cosine top-20 + bm25s top-20 → RRF fuse (`score = Σ 1/(60+rank)`) → dedupe by chunk id → top-20.
- `rerank(question, chunks, top_n=4) -> list[(Chunk, score)]`: FlashRank cross-encoder.
- Injectable embed function for tests.

**`generation.py`** (new)
- `build_prompt(question, chunks)`: strict grounded prompt (answer only from context, 2–4 sentences, no markdown headers, "we/our" voice, refusal string).
- `stream_answer(prompt)`: POST Ollama `/api/generate` with `stream=true`, `think=false`, yields text deltas. `answer(prompt)` non-stream wrapper for the legacy endpoint.

**`main.py`** (rewritten)
- `POST /chat` — legacy contract kept: `{answer, sources}` (non-streaming) so the old bundle keeps working during rollout.
- `POST /chat/stream` — SSE: `data: {"delta": "..."}` lines, final `data: {"done": true, "sources": [...]}`.
- Confidence gate: best rerank score < `MIN_RERANK_SCORE` (env, default tuned during testing) → return the refusal string without calling the LLM.
- No Gemini, no LangChain. CORS stays `*` (public embeddable widget by design).

**`static/widget.js`** (new, replaces chatbot.js)
- Vanilla JS + inline CSS, ≤ ~300 lines: floating button, chat panel, message list, SSE streaming render, sources line, error state ("assistant unavailable").
- `embed.js` unchanged except pointing at `widget.js` — client sites keep their one script tag.
- Old `chatbot.js` / `chatbotold2.js` deleted after cutover.

**Dependencies**: fastapi, uvicorn, requests, beautifulsoup4, selenium, webdriver-manager, python-dotenv, faiss-cpu, numpy, bm25s, flashrank, pydantic, pytest (dev). Removed: langchain-community, langchain-ollama, langchain-core, langchain-text-splitters, google-generativeai.

## Error handling

- Ollama down → `/chat` returns refusal-style "assistant unavailable" message, `/chat/stream` sends error event; widget shows it inline.
- Empty retrieval or gated → fixed refusal string, no LLM call.
- Ingest: per-page try/except as today; abort with message if 0 documents.

## Testing (pytest, no live models)

- Fake embed fn + tiny FAISS index fixture; recorded bm25 corpus.
- Tests: RRF fusion math, dedupe, confidence gate (above/below threshold), prompt contains context + question, SSE endpoint yields deltas then done (mock Ollama via httpx/requests monkeypatch), legacy `/chat` shape.
- Live smoke script `smoke.py`: real question against running Ollama, prints answer + latency breakdown (retrieve / rerank / first-token / total).

## Migration

1. Build new pipeline alongside old files; re-ingest sahilsidhu.pro into `store/`.
2. Verify with smoke script + widget on localhost.
3. Swap `embed.js` target, delete old bundle + `vectorstore/` + Gemini env keys.

## Out of scope

Multi-tenant (per-client indexes), analytics, chat history/memory, non-English, GPU serving.
