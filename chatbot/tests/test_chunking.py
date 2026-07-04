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
