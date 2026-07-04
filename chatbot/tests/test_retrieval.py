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
