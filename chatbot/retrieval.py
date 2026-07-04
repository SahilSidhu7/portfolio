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
