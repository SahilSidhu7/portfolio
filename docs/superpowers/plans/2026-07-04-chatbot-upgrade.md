# Chatbot Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio chatbot's RAG pipeline with small local models — hybrid retrieval (FAISS + bm25s + RRF), FlashRank reranking, confidence gating, streaming generation via Ollama qwen3:1.7b — plus a 3KB vanilla-JS streaming widget.

**Architecture:** question → hybrid retrieve (dense FAISS + sparse bm25s, RRF-fused) → FlashRank rerank top-20→4 → confidence gate on rerank score → grounded prompt → Ollama streaming generation → SSE to widget. No LangChain, no cloud LLMs.

**Tech Stack:** Python 3.11+, FastAPI, faiss-cpu, numpy, bm25s, flashrank, requests, Ollama (`embeddinggemma`, `qwen3:1.7b`), vanilla JS widget.

## Global Constraints

- Working directory: `C:/Portfolio/portfolio/chatbot/` (all paths below relative to it). Commits go to the portfolio repo root.
- No new model runtimes: embeddings and generation go through Ollama HTTP API; reranker is in-process ONNX via flashrank.
- Env vars (with defaults in code): `OLLAMA_URL=http://localhost:11434`, `EMBED_MODEL=embeddinggemma`, `GEN_MODEL=qwen3:1.7b`, `MIN_RERANK_SCORE=0.3`, `STORE_DIR=store`.
- Refusal string, exact: `I couldn't find that information on this website.`
- Unavailable string, exact: `The assistant is currently unavailable.`
- Legacy API contract preserved: `POST /chat` → `{"answer": str, "sources": [str]}`.
- Tests never call live Ollama or download rerank models — inject fakes.
- Run tests with `python -m pytest tests/ -v` from `chatbot/`.

---

### Task 1: Chunker

**Files:**
- Create: `chatbot/chunking.py`
- Test: `chatbot/tests/test_chunking.py`

**Interfaces:**
- Produces: `split_text(text: str, size: int = 500, overlap: int = 80) -> list[str]`; `make_chunks(pages: list[dict]) -> list[dict]` where pages have keys `url`, `title`, `text` and chunks have keys `id`, `text`, `source`, `title`.

- [ ] **Step 1: Write failing tests**

```python
# chatbot/tests/test_chunking.py
from chunking import split_text, make_chunks


def test_short_text_single_chunk():
    assert split_text("hello world") == ["hello world"]


def test_long_text_splits_with_overlap():
    text = "\n\n".join(f"Paragraph {i} " + "x" * 200 for i in range(10))
    parts = split_text(text, size=500, overlap=80)
    assert all(len(p) <= 600 for p in parts)  # size + tolerance for paragraph packing
    assert len(parts) >= 4
    # overlap: consecutive chunks share text
    assert parts[0][-40:] in parts[1]


def test_giant_paragraph_hard_split():
    text = "y" * 2000
    parts = split_text(text, size=500, overlap=80)
    assert all(len(p) <= 500 for p in parts)
    assert sum(len(p) for p in parts) >= 2000  # overlap means total >= original


def test_make_chunks_prefixes_title_and_assigns_ids():
    pages = [{"url": "https://x.com/a", "title": "About", "text": "Some body text."}]
    chunks = make_chunks(pages)
    assert chunks[0]["id"] == 0
    assert chunks[0]["source"] == "https://x.com/a"
    assert chunks[0]["title"] == "About"
    assert chunks[0]["text"].startswith("About — https://x.com/a\n")
    assert "Some body text." in chunks[0]["text"]
```

- [ ] **Step 2: Run tests, verify fail**

Run: `cd C:/Portfolio/portfolio/chatbot && python -m pytest tests/test_chunking.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'chunking'`
(If `tests/` lacks `__init__.py` context, add empty `chatbot/tests/__init__.py` and `chatbot/conftest.py` containing `import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).parent))`.)

- [ ] **Step 3: Implement**

```python
# chatbot/chunking.py
def split_text(text: str, size: int = 500, overlap: int = 80) -> list[str]:
    """Pack paragraphs into ~size-char chunks; hard-split oversized paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    pieces = []
    for p in paragraphs:
        while len(p) > size:
            pieces.append(p[:size])
            p = p[size - overlap:]
        pieces.append(p)

    chunks = []
    current = ""
    for piece in pieces:
        if current and len(current) + len(piece) + 2 > size:
            chunks.append(current)
            current = current[-overlap:] if overlap else ""
        current = (current + "\n\n" + piece).strip() if current else piece
    if current:
        chunks.append(current)
    return chunks or [text.strip()]


def make_chunks(pages: list[dict]) -> list[dict]:
    """Turn scraped pages into id'd chunks with a title—url context prefix."""
    chunks = []
    for page in pages:
        prefix = f"{page['title']} — {page['url']}\n"
        for part in split_text(page["text"]):
            chunks.append({
                "id": len(chunks),
                "text": prefix + part,
                "source": page["url"],
                "title": page["title"],
            })
    return chunks
```

- [ ] **Step 4: Run tests, verify pass**

Run: `python -m pytest tests/test_chunking.py -v`
Expected: 4 passed. If `test_long_text_splits_with_overlap` fails on the ≤600 bound, adjust packing so a chunk closes before exceeding `size` plus the overlap tail — do not raise the bound.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/chunking.py chatbot/tests/ chatbot/conftest.py
git commit -m "feat(chatbot): paragraph-packing chunker with overlap"
```

---

### Task 2: Hybrid retrieval — RRF fusion, embeddings client, index build/load

**Files:**
- Create: `chatbot/retrieval.py`
- Test: `chatbot/tests/test_retrieval.py`

**Interfaces:**
- Consumes: chunk dicts from Task 1 (`id`, `text`, `source`, `title`).
- Produces:
  - `rrf(rankings: list[list[int]], k: int = 60) -> list[int]` (fused ids, best first)
  - `embed_texts(texts: list[str], model: str | None = None, url: str | None = None) -> np.ndarray` (float32, L2-normalized rows) — POSTs Ollama `/api/embed`
  - `build_indexes(chunks: list[dict], store_dir: str = "store", embed=embed_texts) -> None` (writes `chunks.jsonl`, `index.faiss`, `bm25/`)
  - `class Store` with `Store.load(store_dir) -> Store`, attributes `.chunks`, `.index`, `.bm25`, `.tokens`
  - `search(store: Store, question: str, k: int = 20, embed=embed_texts) -> list[dict]`

- [ ] **Step 1: Write failing tests**

```python
# chatbot/tests/test_retrieval.py
import numpy as np
import retrieval
from retrieval import rrf, build_indexes, Store, search


def fake_embed(texts, model=None, url=None):
    """Deterministic 8-dim embedding: bag of char-codes, normalized."""
    out = np.zeros((len(texts), 8), dtype="float32")
    for i, t in enumerate(texts):
        for j, ch in enumerate(t.lower()):
            out[i, j % 8] += ord(ch) % 23
    norms = np.linalg.norm(out, axis=1, keepdims=True)
    return out / np.clip(norms, 1e-9, None)


CHUNKS = [
    {"id": 0, "text": "Home — https://x.com\nWe build AI chatbots for websites.", "source": "https://x.com", "title": "Home"},
    {"id": 1, "text": "Pricing — https://x.com/pricing\nThe chatbot service costs $99 per month.", "source": "https://x.com/pricing", "title": "Pricing"},
    {"id": 2, "text": "Contact — https://x.com/contact\nEmail us at hi@x.com to get started.", "source": "https://x.com/contact", "title": "Contact"},
]


def test_rrf_prefers_id_ranked_high_in_both():
    fused = rrf([[1, 2, 0], [1, 0, 2]])
    assert fused[0] == 1


def test_rrf_dedupes():
    fused = rrf([[0, 1], [1, 0]])
    assert sorted(fused) == [0, 1] and len(fused) == 2


def test_build_and_search_roundtrip(tmp_path):
    store_dir = str(tmp_path / "store")
    build_indexes(CHUNKS, store_dir=store_dir, embed=fake_embed)
    store = Store.load(store_dir)
    assert len(store.chunks) == 3
    results = search(store, "how much does the chatbot cost per month", k=2, embed=fake_embed)
    assert len(results) == 2
    assert any(r["id"] == 1 for r in results)  # bm25 must surface "cost/month" chunk


def test_embed_texts_posts_to_ollama(monkeypatch):
    calls = {}

    class FakeResp:
        def raise_for_status(self): pass
        def json(self): return {"embeddings": [[3.0, 4.0]]}

    def fake_post(url, json=None, timeout=None):
        calls["url"] = url
        calls["json"] = json
        return FakeResp()

    monkeypatch.setattr(retrieval.requests, "post", fake_post)
    vecs = retrieval.embed_texts(["hello"], model="embeddinggemma", url="http://o:11434")
    assert calls["url"] == "http://o:11434/api/embed"
    assert calls["json"] == {"model": "embeddinggemma", "input": ["hello"]}
    assert np.allclose(np.linalg.norm(vecs, axis=1), 1.0)  # normalized
```

- [ ] **Step 2: Run tests, verify fail**

Run: `python -m pytest tests/test_retrieval.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'retrieval'`

- [ ] **Step 3: Install new deps**

Run: `pip install faiss-cpu numpy bm25s`
(faiss-cpu likely already installed.)

- [ ] **Step 4: Implement**

```python
# chatbot/retrieval.py
import json
import os
import pathlib

import bm25s
import faiss
import numpy as np
import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", os.getenv("ollama_url", "http://localhost:11434"))
EMBED_MODEL = os.getenv("EMBED_MODEL", "embeddinggemma")


def embed_texts(texts: list[str], model: str | None = None, url: str | None = None) -> np.ndarray:
    """Embed via Ollama /api/embed; rows L2-normalized for cosine/IP search."""
    r = requests.post(
        f"{url or OLLAMA_URL}/api/embed",
        json={"model": model or EMBED_MODEL, "input": texts},
        timeout=120,
    )
    r.raise_for_status()
    vecs = np.array(r.json()["embeddings"], dtype="float32")
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs / np.clip(norms, 1e-9, None)


def rrf(rankings: list[list[int]], k: int = 60) -> list[int]:
    """Reciprocal rank fusion: score(id) = sum over lists of 1/(k + rank)."""
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, cid in enumerate(ranking):
            scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)


def build_indexes(chunks: list[dict], store_dir: str = "store", embed=embed_texts) -> None:
    path = pathlib.Path(store_dir)
    path.mkdir(parents=True, exist_ok=True)

    with open(path / "chunks.jsonl", "w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    vecs = embed([c["text"] for c in chunks])
    index = faiss.IndexFlatIP(vecs.shape[1])
    index.add(vecs)
    faiss.write_index(index, str(path / "index.faiss"))

    tokens = bm25s.tokenize([c["text"] for c in chunks], stopwords="en")
    bm25 = bm25s.BM25()
    bm25.index(tokens)
    bm25.save(str(path / "bm25"))


class Store:
    def __init__(self, chunks, index, bm25):
        self.chunks = chunks
        self.index = index
        self.bm25 = bm25

    @classmethod
    def load(cls, store_dir: str = "store") -> "Store":
        path = pathlib.Path(store_dir)
        chunks = [json.loads(line) for line in open(path / "chunks.jsonl", encoding="utf-8")]
        index = faiss.read_index(str(path / "index.faiss"))
        bm25 = bm25s.BM25.load(str(path / "bm25"))
        return cls(chunks, index, bm25)


def search(store: Store, question: str, k: int = 20, embed=embed_texts) -> list[dict]:
    """Hybrid: dense FAISS + sparse bm25s, RRF-fused, top-k chunk dicts."""
    n = len(store.chunks)
    k_each = min(k, n)

    qvec = embed([question])
    _, dense_ids = store.index.search(qvec, k_each)
    dense_ranking = [int(i) for i in dense_ids[0] if i >= 0]

    qtokens = bm25s.tokenize([question], stopwords="en")
    sparse_ids, _ = store.bm25.retrieve(qtokens, k=k_each)
    sparse_ranking = [int(i) for i in sparse_ids[0]]

    fused = rrf([dense_ranking, sparse_ranking])[:k]
    return [store.chunks[cid] for cid in fused]
```

- [ ] **Step 5: Run tests, verify pass**

Run: `python -m pytest tests/test_retrieval.py -v`
Expected: 4 passed. Known trap: `bm25s.tokenize` returns a `Tokenized` namedtuple when given a list — passing it straight to `.index()` / `.retrieve()` as shown is the supported pattern. If `retrieve` errors on corpus size, ensure `k_each <= n`.

- [ ] **Step 6: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/retrieval.py chatbot/tests/test_retrieval.py
git commit -m "feat(chatbot): hybrid retrieval — FAISS + bm25s fused with RRF"
```

---

### Task 3: Reranker + confidence gate

**Files:**
- Modify: `chatbot/retrieval.py` (append)
- Test: `chatbot/tests/test_rerank.py`

**Interfaces:**
- Produces: `rerank(question: str, chunks: list[dict], top_n: int = 4, ranker=None) -> list[tuple[dict, float]]` (sorted best-first); `passes_gate(ranked: list[tuple[dict, float]], threshold: float | None = None) -> bool`; module constant `MIN_RERANK_SCORE` (float from env, default 0.3).

- [ ] **Step 1: Write failing tests**

```python
# chatbot/tests/test_rerank.py
import retrieval
from retrieval import rerank, passes_gate

CHUNKS = [
    {"id": 0, "text": "We build AI chatbots.", "source": "a", "title": "Home"},
    {"id": 1, "text": "The service costs $99 per month.", "source": "b", "title": "Pricing"},
]


class FakeRanker:
    def rerank(self, request):
        # flashrank-shaped: list of dicts with id/text/score, any order
        return [
            {"id": 1, "text": CHUNKS[1]["text"], "score": 0.9},
            {"id": 0, "text": CHUNKS[0]["text"], "score": 0.2},
        ]


def test_rerank_orders_by_score_and_pairs_chunks():
    ranked = rerank("price?", CHUNKS, top_n=2, ranker=FakeRanker())
    assert ranked[0][0]["id"] == 1 and ranked[0][1] == 0.9
    assert ranked[1][0]["id"] == 0


def test_rerank_truncates_to_top_n():
    ranked = rerank("price?", CHUNKS, top_n=1, ranker=FakeRanker())
    assert len(ranked) == 1


def test_gate_passes_above_threshold():
    assert passes_gate([({}, 0.9)], threshold=0.3) is True


def test_gate_fails_below_threshold_or_empty():
    assert passes_gate([({}, 0.1)], threshold=0.3) is False
    assert passes_gate([], threshold=0.3) is False
```

- [ ] **Step 2: Run tests, verify fail**

Run: `python -m pytest tests/test_rerank.py -v`
Expected: FAIL — `ImportError: cannot import name 'rerank'`

- [ ] **Step 3: Install flashrank and implement**

Run: `pip install flashrank`

Append to `chatbot/retrieval.py`:

```python
MIN_RERANK_SCORE = float(os.getenv("MIN_RERANK_SCORE", "0.3"))

_ranker = None


def _default_ranker():
    """Lazy-load flashrank so tests never download the ONNX model."""
    global _ranker
    if _ranker is None:
        from flashrank import Ranker
        _ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="models")
    return _ranker


def rerank(question: str, chunks: list[dict], top_n: int = 4, ranker=None) -> list[tuple[dict, float]]:
    if not chunks:
        return []
    ranker = ranker or _default_ranker()
    from flashrank import RerankRequest
    request = RerankRequest(
        query=question,
        passages=[{"id": c["id"], "text": c["text"]} for c in chunks],
    )
    results = ranker.rerank(request)
    by_id = {c["id"]: c for c in chunks}
    ranked = sorted(results, key=lambda r: r["score"], reverse=True)[:top_n]
    return [(by_id[r["id"]], float(r["score"])) for r in ranked]


def passes_gate(ranked: list[tuple[dict, float]], threshold: float | None = None) -> bool:
    if not ranked:
        return False
    limit = MIN_RERANK_SCORE if threshold is None else threshold
    return ranked[0][1] >= limit
```

Note: `FakeRanker.rerank` takes the request object but ignores it — flashrank's real `Ranker.rerank(RerankRequest)` returns `[{"id", "text", "score"}, ...]`. The `from flashrank import RerankRequest` inside `rerank()` runs even with an injected ranker; flashrank is installed, so the import is cheap and downloads nothing (only `Ranker()` construction downloads).

- [ ] **Step 4: Run tests, verify pass**

Run: `python -m pytest tests/test_rerank.py -v`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/retrieval.py chatbot/tests/test_rerank.py
git commit -m "feat(chatbot): flashrank reranker with confidence gate"
```

---

### Task 4: Generation — grounded prompt + streaming Ollama client

**Files:**
- Create: `chatbot/generation.py`
- Test: `chatbot/tests/test_generation.py`

**Interfaces:**
- Produces: `REFUSAL: str`, `UNAVAILABLE: str` (exact strings from Global Constraints); `build_prompt(question: str, chunks: list[dict]) -> str`; `stream_answer(prompt: str, model=None, url=None) -> Iterator[str]`; `answer(prompt: str, model=None, url=None) -> str`.

- [ ] **Step 1: Write failing tests**

```python
# chatbot/tests/test_generation.py
import json
import generation
from generation import REFUSAL, build_prompt, stream_answer, answer


def test_prompt_contains_context_question_and_rules():
    chunks = [{"id": 0, "text": "Home — url\nWe build chatbots.", "source": "u", "title": "Home"}]
    p = build_prompt("what do you do?", chunks)
    assert "We build chatbots." in p
    assert "what do you do?" in p
    assert REFUSAL in p  # model is told the exact refusal string


class FakeStreamResp:
    def __init__(self, lines):
        self._lines = lines
    def raise_for_status(self): pass
    def iter_lines(self):
        for l in self._lines:
            yield json.dumps(l).encode()
    def __enter__(self): return self
    def __exit__(self, *a): return False


def test_stream_answer_yields_deltas(monkeypatch):
    lines = [
        {"response": "We build ", "done": False},
        {"response": "chatbots.", "done": False},
        {"response": "", "done": True},
    ]
    captured = {}

    def fake_post(url, json=None, stream=False, timeout=None):
        captured["url"] = url
        captured["payload"] = json
        return FakeStreamResp(lines)

    monkeypatch.setattr(generation.requests, "post", fake_post)
    out = list(stream_answer("prompt", model="qwen3:1.7b", url="http://o:11434"))
    assert out == ["We build ", "chatbots."]
    assert captured["url"] == "http://o:11434/api/generate"
    assert captured["payload"]["think"] is False
    assert captured["payload"]["stream"] is True


def test_answer_joins_stream(monkeypatch):
    monkeypatch.setattr(generation, "stream_answer", lambda *a, **k: iter(["a", "b"]))
    assert answer("p") == "ab"
```

- [ ] **Step 2: Run tests, verify fail**

Run: `python -m pytest tests/test_generation.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'generation'`

- [ ] **Step 3: Implement**

```python
# chatbot/generation.py
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
```

- [ ] **Step 4: Run tests, verify pass**

Run: `python -m pytest tests/test_generation.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/generation.py chatbot/tests/test_generation.py
git commit -m "feat(chatbot): grounded prompt + streaming Ollama generation"
```

---

### Task 5: API — rewrite main.py with /chat and /chat/stream

**Files:**
- Modify: `chatbot/main.py` (full rewrite)
- Test: `chatbot/tests/test_api.py`

**Interfaces:**
- Consumes: `Store.load`, `search`, `rerank`, `passes_gate` (Task 2/3); `build_prompt`, `answer`, `stream_answer`, `REFUSAL`, `UNAVAILABLE` (Task 4).
- Produces: `POST /chat` → `{"answer", "sources"}`; `POST /chat/stream` → SSE lines `data: {"delta": str}` then `data: {"done": true, "sources": [str]}`; `get_store()` cached loader (tests monkeypatch `main._store`).

- [ ] **Step 1: Write failing tests**

```python
# chatbot/tests/test_api.py
import json
import main
from fastapi.testclient import TestClient
from generation import REFUSAL

client = TestClient(main.app)

CHUNK = {"id": 0, "text": "Pricing — u\n$99/month.", "source": "https://x.com/pricing", "title": "Pricing"}


def wire(monkeypatch, ranked, deltas=("$99", "/month.")):
    monkeypatch.setattr(main, "_store", object())
    monkeypatch.setattr(main.retrieval, "search", lambda store, q, **k: [CHUNK])
    monkeypatch.setattr(main.retrieval, "rerank", lambda q, chunks, **k: ranked)
    monkeypatch.setattr(main.generation, "answer", lambda prompt, **k: "".join(deltas))
    monkeypatch.setattr(main.generation, "stream_answer", lambda prompt, **k: iter(deltas))


def test_chat_answers_with_sources(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])
    resp = client.post("/chat", json={"question": "price?"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["answer"] == "$99/month."
    assert body["sources"] == ["https://x.com/pricing"]


def test_chat_gated_returns_refusal_without_llm(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.01)])
    monkeypatch.setattr(main.generation, "answer",
                        lambda *a, **k: (_ for _ in ()).throw(AssertionError("LLM called")))
    resp = client.post("/chat", json={"question": "moon landing?"})
    assert resp.json() == {"answer": REFUSAL, "sources": []}


def test_stream_yields_deltas_then_done(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])
    with client.stream("POST", "/chat/stream", json={"question": "price?"}) as resp:
        assert resp.status_code == 200
        events = [json.loads(l[6:]) for l in resp.iter_lines() if l.startswith("data: ")]
    assert events[0] == {"delta": "$99"}
    assert events[1] == {"delta": "/month."}
    assert events[-1] == {"done": True, "sources": ["https://x.com/pricing"]}


def test_stream_gated(monkeypatch):
    wire(monkeypatch, ranked=[])
    with client.stream("POST", "/chat/stream", json={"question": "?"}) as resp:
        events = [json.loads(l[6:]) for l in resp.iter_lines() if l.startswith("data: ")]
    assert events[0] == {"delta": REFUSAL}
    assert events[-1] == {"done": True, "sources": []}
```

- [ ] **Step 2: Run tests, verify fail**

Run: `python -m pytest tests/test_api.py -v`
Expected: FAIL — old main.py imports langchain / has no `_store`. (If import of old main.py itself errors, that's the expected fail state.)

- [ ] **Step 3: Rewrite main.py**

```python
# chatbot/main.py
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
    allow_credentials=True,
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
    if not retrieval.passes_gate(ranked):
        return None, []
    chunks = [c for c, _ in ranked]
    sources = list(dict.fromkeys(c["source"] for c in chunks))
    return chunks, sources


@app.post("/chat")
def chat(req: ChatRequest):
    chunks, sources = retrieve(req.question)
    if chunks is None:
        return {"answer": generation.REFUSAL, "sources": []}
    try:
        text = generation.answer(generation.build_prompt(req.question, chunks))
    except Exception:
        return {"answer": generation.UNAVAILABLE, "sources": []}
    return {"answer": text, "sources": sources}


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    chunks, sources = retrieve(req.question)

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
```

- [ ] **Step 4: Run tests, verify pass**

Run: `python -m pytest tests/test_api.py -v` then full suite `python -m pytest tests/ -v`
Expected: all pass. Gate test relies on `main._store` monkeypatch preventing real store load — `retrieve` calls `get_store()` which returns the patched object without touching disk.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/main.py chatbot/tests/test_api.py
git commit -m "feat(chatbot): rewrite API — hybrid RAG pipeline, SSE streaming, no LangChain/Gemini"
```

---

### Task 6: Ingest rewrite — crawler kept, new store output

**Files:**
- Modify: `chatbot/ingest.py` (replace langchain parts; keep `scrape_website` selenium crawler as-is except return shape)
- Test: `chatbot/tests/test_ingest.py`

**Interfaces:**
- Consumes: `make_chunks` (Task 1), `build_indexes` (Task 2).
- Produces: `pages_from_documents` removed — `scrape_website(base_url, max_pages=50) -> list[dict]` now returns `[{"url", "title", "text"}]`; `main()` runs scrape → chunk → index.

- [ ] **Step 1: Write failing test**

```python
# chatbot/tests/test_ingest.py
import ingest


def test_ingest_pipeline_builds_store(tmp_path, monkeypatch):
    pages = [{"url": "https://s.pro", "title": "Home", "text": "I build AI systems end to end."}]
    monkeypatch.setattr(ingest, "scrape_website", lambda url, max_pages=50: pages)
    captured = {}
    monkeypatch.setattr(ingest, "build_indexes",
                        lambda chunks, store_dir="store", embed=None: captured.update(chunks=chunks, store_dir=store_dir))
    ingest.main(store_dir=str(tmp_path / "store"))
    assert captured["chunks"][0]["source"] == "https://s.pro"
    assert "AI systems" in captured["chunks"][0]["text"]
```

- [ ] **Step 2: Run test, verify fail**

Run: `python -m pytest tests/test_ingest.py -v`
Expected: FAIL — old ingest imports langchain modules (`ModuleNotFoundError` if langchain uninstalled, or `AttributeError: main`).

- [ ] **Step 3: Modify ingest.py**

Keep the whole selenium `scrape_website` function body, with two changes: (a) delete every langchain import and `create_vector_store`; (b) where it currently appends `Document(page_content=text, metadata={...})`, append a dict instead. New imports/footer:

```python
# top of chatbot/ingest.py — replace the import block with:
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

from chunking import make_chunks
from retrieval import build_indexes

load_dotenv()
```

Inside `scrape_website`, the document append becomes:

```python
                if text.strip():
                    documents.append({"url": url, "title": title, "text": text})
```

Replace everything from `def create_vector_store` down with:

```python
def main(base_url: str = "https://sahilsidhu.pro", store_dir: str = "store"):
    pages = scrape_website(base_url)
    print(f"Scraped {len(pages)} pages")
    if not pages:
        print("No documents scraped.")
        return
    chunks = make_chunks(pages)
    print(f"Created {len(chunks)} chunks")
    build_indexes(chunks, store_dir=store_dir)
    print(f"Store written to {store_dir}/")


if __name__ == "__main__":
    main()
```

(`HEADERS` stays; the local `import re` inside the loop is now redundant — `re` is imported at top, delete the inner import.)

- [ ] **Step 4: Run test + full suite, verify pass**

Run: `python -m pytest tests/ -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/ingest.py chatbot/tests/test_ingest.py
git commit -m "feat(chatbot): ingest writes hybrid store, langchain removed"
```

---

### Task 7: Streaming widget — vanilla JS

**Files:**
- Create: `chatbot/static/widget.js`
- Modify: `chatbot/static/embed.js` (point at widget.js)

**Interfaces:**
- Consumes: `POST {origin}/chat/stream` SSE contract from Task 5. Backend origin derived from the widget script's own `src`.

- [ ] **Step 1: Write widget.js**

```javascript
// chatbot/static/widget.js — dependency-free streaming chat widget (~3KB gzipped)
(function () {
  const ORIGIN = new URL(document.currentScript.src).origin;
  const REFUSAL_STYLE = 'color:#a79ec0';

  const css = `
  #pchat-btn{position:fixed;bottom:20px;right:20px;z-index:99999;width:56px;height:56px;border-radius:50%;
    border:none;cursor:pointer;background:#8674f4;color:#fff;font-size:24px;box-shadow:0 4px 20px rgba(0,0,0,.35)}
  #pchat-panel{position:fixed;bottom:88px;right:20px;z-index:99999;width:min(360px,calc(100vw - 32px));
    height:480px;max-height:70vh;display:none;flex-direction:column;background:#171321;color:#f0edf7;
    border:1px solid #2a2438;border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,.5);overflow:hidden;
    font:14px/1.5 system-ui,sans-serif}
  #pchat-panel.open{display:flex}
  #pchat-head{padding:12px 16px;background:#1e1930;border-bottom:1px solid #2a2438;font-weight:600}
  #pchat-head small{display:block;font-weight:400;color:#a79ec0;font-size:11px}
  #pchat-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
  .pchat-m{max-width:85%;padding:8px 12px;border-radius:10px;white-space:pre-wrap;word-wrap:break-word}
  .pchat-user{align-self:flex-end;background:#8674f4;color:#fff}
  .pchat-bot{align-self:flex-start;background:#1e1930;border:1px solid #2a2438}
  .pchat-src{align-self:flex-start;font-size:11px;color:#a79ec0;padding:0 4px}
  .pchat-src a{color:#a493ff;text-decoration:none}
  #pchat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #2a2438;background:#1e1930}
  #pchat-in{flex:1;padding:9px 12px;border-radius:8px;border:1px solid #2a2438;background:#171321;
    color:#f0edf7;outline:none;font:inherit}
  #pchat-send{padding:9px 14px;border:none;border-radius:8px;background:#8674f4;color:#fff;cursor:pointer;font:inherit}
  #pchat-send:disabled{opacity:.5;cursor:default}`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'pchat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.textContent = '✦';

  const panel = document.createElement('div');
  panel.id = 'pchat-panel';
  panel.innerHTML = `
    <div id="pchat-head">Ask about this site<small>AI answers from this website's content — runs on our own server</small></div>
    <div id="pchat-msgs"></div>
    <form id="pchat-form"><input id="pchat-in" placeholder="Type a question…" autocomplete="off">
    <button id="pchat-send" type="submit">Send</button></form>`;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const msgs = panel.querySelector('#pchat-msgs');
  const form = panel.querySelector('#pchat-form');
  const input = panel.querySelector('#pchat-in');
  const send = panel.querySelector('#pchat-send');

  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  function add(cls, text) {
    const el = document.createElement('div');
    el.className = 'pchat-m ' + cls;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function ask(question) {
    add('pchat-user', question);
    const bot = add('pchat-bot', '…');
    send.disabled = true;
    try {
      const resp = await fetch(ORIGIN + '/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!resp.ok || !resp.body) throw new Error('bad response');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const ev of events) {
          if (!ev.startsWith('data: ')) continue;
          const data = JSON.parse(ev.slice(6));
          if (data.delta) {
            text += data.delta;
            bot.textContent = text;
            msgs.scrollTop = msgs.scrollHeight;
          }
          if (data.done && data.sources && data.sources.length) {
            const src = document.createElement('div');
            src.className = 'pchat-src';
            src.append('Sources: ');
            data.sources.forEach((s, i) => {
              const a = document.createElement('a');
              a.href = s; a.target = '_blank'; a.rel = 'noopener';
              a.textContent = new URL(s).pathname || s;
              if (i) src.append(' · ');
              src.appendChild(a);
            });
            msgs.appendChild(src);
          }
        }
      }
      if (!text) bot.textContent = 'The assistant is currently unavailable.';
    } catch (e) {
      bot.textContent = 'The assistant is currently unavailable.';
      bot.setAttribute('style', REFUSAL_STYLE);
    } finally {
      send.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = '';
    ask(q);
  });
})();
```

- [ ] **Step 2: Update embed.js**

```javascript
// chatbot/static/embed.js
(function () {
  const script = document.createElement("script");
  script.src = "https://pchat.webappster.store/static/widget.js?v=1";
  document.body.appendChild(script);
})();
```

(The old container div is unnecessary — widget.js creates its own fixed-position elements.)

- [ ] **Step 3: Verify in browser**

Requires a built store + running Ollama (done properly in Task 8); for a widget-only check, serve with the API tests' fakes unavailable — instead just open a scratch HTML file:

```html
<!-- scratch, not committed: chatbot/widget-test.html -->
<!doctype html><body><script src="http://localhost:8080/static/widget.js"></script></body>
```

Run `uvicorn main:app --port 8080` (store may be missing — button/panel/UI must still render; a question shows the unavailable message). Confirm: button bottom-right, panel opens, input works.

- [ ] **Step 4: Commit**

```bash
cd C:/Portfolio/portfolio && git add chatbot/static/widget.js chatbot/static/embed.js
git commit -m "feat(chatbot): 3KB vanilla streaming widget replaces React bundle"
```

---

### Task 8: Models, re-ingest, live smoke test

**Files:**
- Create: `chatbot/smoke.py`
- Modify: `chatbot/requirements.txt`, `chatbot/.env`

**Interfaces:**
- Consumes: everything.

- [ ] **Step 1: Update requirements.txt**

```
fastapi
uvicorn
requests
beautifulsoup4
selenium
webdriver-manager
python-dotenv
pydantic
faiss-cpu
numpy
bm25s
flashrank
```

Run: `pip install -r requirements.txt`

- [ ] **Step 2: Update .env**

```
OLLAMA_URL=http://localhost:11434
EMBED_MODEL=embeddinggemma
GEN_MODEL=qwen3:1.7b
MIN_RERANK_SCORE=0.3
```

- [ ] **Step 3: Pull models**

Run: `ollama pull embeddinggemma && ollama pull qwen3:1.7b`
Expected: both models listed by `ollama list`. (If this machine lacks Ollama, this task runs on the server — document and continue; smoke test then also runs there.)

- [ ] **Step 4: Write smoke.py**

```python
# chatbot/smoke.py — live pipeline check with latency breakdown. Not a pytest file.
import sys
import time

import generation
import retrieval


def run(question: str, store_dir: str = "store"):
    t0 = time.perf_counter()
    store = retrieval.Store.load(store_dir)
    t1 = time.perf_counter()
    candidates = retrieval.search(store, question)
    t2 = time.perf_counter()
    ranked = retrieval.rerank(question, candidates)
    t3 = time.perf_counter()
    print(f"load {t1-t0:.2f}s | retrieve {t2-t1:.2f}s | rerank {t3-t2:.2f}s")
    for chunk, score in ranked:
        print(f"  {score:+.3f}  {chunk['title']}: {chunk['text'][:80]!r}")
    if not retrieval.passes_gate(ranked):
        print(f"GATED (threshold {retrieval.MIN_RERANK_SCORE}) -> refusal")
        return
    prompt = generation.build_prompt(question, [c for c, _ in ranked])
    first = None
    parts = []
    for delta in generation.stream_answer(prompt):
        if first is None:
            first = time.perf_counter()
            print(f"first token {first-t3:.2f}s")
        parts.append(delta)
    print(f"total gen {time.perf_counter()-t3:.2f}s\n\n{''.join(parts)}")


if __name__ == "__main__":
    run(" ".join(sys.argv[1:]) or "What projects have you built?")
```

- [ ] **Step 5: Re-ingest and smoke**

Run: `python ingest.py` (crawls sahilsidhu.pro, writes `store/`)
Expected: "Scraped N pages", "Created M chunks", "Store written to store/".

Run: `python smoke.py "what certifications do you have?"` and `python smoke.py "what is the capital of France?"`
Expected: first answers from site content with rerank scores printed; second hits the gate → refusal. **Tune `MIN_RERANK_SCORE` in .env now**: pick a value between the top score of the off-topic question and typical on-topic scores (flashrank MiniLM scores are 0–1 sigmoid-ish).

- [ ] **Step 6: Full test suite + commit**

Run: `python -m pytest tests/ -v`
Expected: all pass.

```bash
cd C:/Portfolio/portfolio && git add chatbot/requirements.txt chatbot/smoke.py
git commit -m "feat(chatbot): smoke script, small-model requirements"
```

(.env stays uncommitted if gitignored; check `git status`.)

---

### Task 9: Cutover + cleanup + README

**Files:**
- Delete: `chatbot/static/chatbot.js`, `chatbot/static/chatbotold2.js`, `chatbot/vectorstore/`
- Create: `chatbot/README.md`

- [ ] **Step 1: End-to-end check via widget**

Run `uvicorn main:app --port 8080`, open the Task 7 scratch HTML, ask "what projects have you built?" — streamed answer with sources appears.

- [ ] **Step 2: Delete old artifacts**

```bash
cd C:/Portfolio/portfolio/chatbot
git rm static/chatbot.js static/chatbotold2.js
git rm -r vectorstore 2>/dev/null || rm -rf vectorstore
rm -f widget-test.html
```

(If `vectorstore/` was never tracked, plain `rm -rf`.)

- [ ] **Step 3: Write README.md**

```markdown
# Website Chatbot — small-model RAG

Embeddable chat widget that answers questions from a website's own content.
Runs entirely on local small models — no API keys, no cloud LLM, privacy-first.

## Stack
- **Retrieval**: hybrid — FAISS dense (embeddinggemma, 300M) + bm25s sparse, fused with reciprocal rank fusion
- **Rerank**: FlashRank cross-encoder (ms-marco-MiniLM-L-12-v2, ~34MB ONNX, CPU)
- **Confidence gate**: rerank score threshold decides "not on this site" — no hallucinated answers
- **Generation**: qwen3:1.7b via Ollama, streaming; `gemma3:1b` is the low-RAM swap (`GEN_MODEL` env)
- **Widget**: dependency-free vanilla JS (~3KB), token-by-token streaming

## Setup
    pip install -r requirements.txt
    ollama pull embeddinggemma && ollama pull qwen3:1.7b
    cp .env.example .env   # or edit .env — OLLAMA_URL, EMBED_MODEL, GEN_MODEL, MIN_RERANK_SCORE

## Index a site
    python ingest.py                       # crawls, chunks, builds store/
    python smoke.py "test question"        # latency breakdown + rerank scores

## Serve
    uvicorn main:app --port 8080

Embed on any site:
    <script src="https://YOUR-HOST/static/embed.js"></script>

## API
- `POST /chat` `{question}` → `{answer, sources}`
- `POST /chat/stream` `{question}` → SSE: `data: {"delta"}` … `data: {"done": true, "sources"}`
```

- [ ] **Step 4: Final suite + commit**

Run: `python -m pytest tests/ -v` — all pass.

```bash
cd C:/Portfolio/portfolio && git add -A chatbot && git commit -m "chore(chatbot): cutover — remove React bundle, old vectorstore; add README"
```

---

## Self-review notes

- Spec coverage: hybrid retrieval (T2), rerank+gate (T3), generation+streaming (T4), API both endpoints (T5), ingest (T6), widget+embed (T7), models/env/smoke/threshold tuning (T8), cutover/cleanup/README (T9). Migration steps in spec map to T8–T9. ✓
- `think: false` — supported by Ollama for qwen3; if the installed Ollama version rejects the field it is ignored, harmless. ✓
- Types consistent: chunk dict shape (`id,text,source,title`) used identically in T1/T2/T3/T5/T6. ✓
