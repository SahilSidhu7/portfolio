from bs4 import BeautifulSoup

import ingest


def test_extract_text_sections_and_footer_not_nav():
    html = "<body><section><span>AZ-900</span><span>957/1000</span></section><footer>email hi@x.com</footer><nav>junk</nav></body>"
    soup = BeautifulSoup(html, "html.parser")
    for element in soup(["script", "style", "nav", "aside", "header"]):
        element.decompose()
    text = ingest.extract_text(soup)
    assert "AZ-900 957/1000" in text
    assert "hi@x.com" in text
    assert "junk" not in text
    sections = text.split("\n\n")
    assert len(sections) == 2


def test_ingest_pipeline_builds_store(tmp_path, monkeypatch):
    pages = [{"url": "https://s.pro", "title": "Home", "text": "I build AI systems end to end."}]
    monkeypatch.setattr(ingest, "scrape_website", lambda url, max_pages=50: pages)
    captured = {}
    monkeypatch.setattr(ingest, "build_indexes",
                        lambda chunks, store_dir="store", embed=None: captured.update(chunks=chunks, store_dir=store_dir))
    ingest.main(store_dir=str(tmp_path / "store"))
    assert captured["chunks"][0]["source"] == "https://s.pro"
    assert "AI systems" in captured["chunks"][0]["text"]
