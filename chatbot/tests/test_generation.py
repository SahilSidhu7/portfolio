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
