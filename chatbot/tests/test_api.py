import json
import main
from fastapi.testclient import TestClient
from generation import REFUSAL, UNAVAILABLE

client = TestClient(main.app)

CHUNK = {"id": 0, "text": "Pricing — u\n$99/month.", "source": "https://x.com/pricing", "title": "Pricing"}


def wire(monkeypatch, ranked, deltas=("$99", "/month.")):
    monkeypatch.setattr(main, "_store", object())
    monkeypatch.setattr(main.retrieval, "search", lambda store, q, **k: [CHUNK])
    monkeypatch.setattr(main.retrieval, "rerank", lambda q, chunks, **k: ranked)
    monkeypatch.setattr(main.retrieval, "bm25_top", lambda s, q: 0.0)
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
    wire(monkeypatch, ranked=[(CHUNK, 0.001)])
    monkeypatch.setattr(main.generation, "answer",
                        lambda *a, **k: (_ for _ in ()).throw(AssertionError("LLM called")))
    resp = client.post("/chat", json={"question": "moon landing?"})
    assert resp.json() == {"answer": REFUSAL, "sources": []}


def test_chat_bm25_fallback_passes_gate_when_rerank_low(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.0001)])
    monkeypatch.setattr(main.retrieval, "bm25_top", lambda s, q: 5.0)
    resp = client.post("/chat", json={"question": "price?"})
    assert resp.json() == {"answer": "$99/month.", "sources": ["https://x.com/pricing"]}


def test_chat_gated_when_rerank_and_bm25_both_low(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.0001)])
    monkeypatch.setattr(main.retrieval, "bm25_top", lambda s, q: 0.0)
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


def test_chat_generation_unavailable(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])
    monkeypatch.setattr(main.generation, "answer",
                        lambda *a, **k: (_ for _ in ()).throw(RuntimeError("ollama down")))
    resp = client.post("/chat", json={"question": "price?"})
    assert resp.json() == {"answer": UNAVAILABLE, "sources": []}


def test_stream_generation_unavailable(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])

    def raise_stream(*a, **k):
        raise RuntimeError("ollama down")

    monkeypatch.setattr(main.generation, "stream_answer", raise_stream)
    with client.stream("POST", "/chat/stream", json={"question": "price?"}) as resp:
        events = [json.loads(l[6:]) for l in resp.iter_lines() if l.startswith("data: ")]
    assert events[0] == {"delta": UNAVAILABLE}
    assert events[-1] == {"done": True, "sources": ["https://x.com/pricing"]}


def test_chat_retrieval_unavailable(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])

    def raise_search(*a, **k):
        raise RuntimeError("ollama down")

    monkeypatch.setattr(main.retrieval, "search", raise_search)
    resp = client.post("/chat", json={"question": "price?"})
    assert resp.json() == {"answer": UNAVAILABLE, "sources": []}


def test_stream_retrieval_unavailable(monkeypatch):
    wire(monkeypatch, ranked=[(CHUNK, 0.9)])

    def raise_search(*a, **k):
        raise RuntimeError("ollama down")

    monkeypatch.setattr(main.retrieval, "search", raise_search)
    with client.stream("POST", "/chat/stream", json={"question": "price?"}) as resp:
        events = [json.loads(l[6:]) for l in resp.iter_lines() if l.startswith("data: ")]
    assert events[0] == {"delta": UNAVAILABLE}
    assert events[-1] == {"done": True, "sources": []}
