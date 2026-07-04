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
            overlap_text = current[-overlap:] if overlap else ""
            # Only use overlap if it doesn't exceed size with the piece
            if overlap_text and len(overlap_text) + len(piece) + 2 <= size:
                current = (overlap_text + "\n\n" + piece).strip()
            else:
                current = piece
        else:
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
