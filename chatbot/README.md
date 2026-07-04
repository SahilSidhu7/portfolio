# Website Chatbot — small-model RAG

Embeddable chat widget that answers questions from a website's own content.
Runs entirely on local small models — no API keys, no cloud LLM, privacy-first.

## Stack
- **Retrieval**: hybrid — FAISS dense (embeddinggemma, 300M) + bm25s sparse, fused with reciprocal rank fusion
- **Rerank**: FlashRank cross-encoder (ms-marco-MiniLM-L-12-v2, ~34MB ONNX, CPU)
- **Confidence gate**: dual-evidence — answers only if rerank score >= `MIN_RERANK_SCORE` OR BM25 lexical overlap >= `MIN_BM25_SCORE`; otherwise a fixed "not on this site" refusal, no hallucinated answers
- **Generation**: qwen3:1.7b via Ollama, streaming (`GEN_MODEL` env to swap models)
- **Widget**: dependency-free vanilla JS (~3KB), token-by-token streaming

## Setup
    pip install -r requirements.txt
    ollama pull embeddinggemma && ollama pull qwen3:1.7b
    cp .env.example .env   # edit OLLAMA_URL, EMBED_MODEL, GEN_MODEL, MIN_RERANK_SCORE, MIN_BM25_SCORE

`MIN_RERANK_SCORE` and `MIN_BM25_SCORE` are the gate thresholds — tune them per site with `smoke.py`
(see Latency & tuning below). Small sites with sparse content typically need a lower
`MIN_BM25_SCORE` (~0.5) to avoid gating out valid questions.

## Index a site
    python ingest.py                                                          # defaults to sahilsidhu.pro, writes store/
    python -c "from ingest import main; main(base_url='https://client-site.com')"   # index a different site
    python smoke.py "test question"                                           # latency breakdown + rerank/BM25 scores

## Serve
    uvicorn main:app --port 8080

Embed on any site:
    <script src="https://YOUR-HOST/static/embed.js"></script>

## API
- `POST /chat` `{question}` → `{answer, sources}`
- `POST /chat/stream` `{question}` → SSE: `data: {"delta"}` … `data: {"done": true, "sources"}`

## Latency & tuning (honesty section)
On CPU-only hardware, expect:
- ~2-4s for retrieval + rerank (embed query, FAISS + bm25s search, FlashRank cross-encoder)
- ~15-40s to first token with qwen3:1.7b — this is prompt-eval bound (long context of retrieved
  chunks), not a generation-speed problem

Generation streams token-by-token once it starts, so the widget shows visible progress well
before the full answer lands rather than one long silent wait. `keep_alive: 30m` keeps the
model resident in Ollama between requests so sporadic widget traffic doesn't pay a cold-load
penalty each time.

GPU hardware is substantially faster on both numbers above — the CPU figures are the
worst-case baseline to set expectations against.

Use `smoke.py "<question>"` to see the actual retrieval/rerank/BM25/gate breakdown against
your indexed store, and to re-tune `MIN_RERANK_SCORE` / `MIN_BM25_SCORE` after indexing a new site.
