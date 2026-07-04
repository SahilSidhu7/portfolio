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
