def _word_boundary_cut(p: str, size: int) -> int:
    """Index to cut p at, preferring the last space in p[:size] if one exists past size-120."""
    window = p[:size]
    space = window.rfind(" ")
    if space > size - 120:
        return space
    return size


def _nearest_space_start(p: str, pos: int) -> int:
    """Snap an overlap start offset to the nearest space boundary (word start); pos unchanged if p has no spaces there."""
    left = p.rfind(" ", 0, pos + 1)
    right = p.find(" ", pos)
    if left == -1 and right == -1:
        return pos
    if left == -1:
        return right + 1
    if right == -1:
        return left + 1
    return left + 1 if (pos - left) <= (right - pos) else right + 1


def split_text(text: str, size: int = 500, overlap: int = 80) -> list[str]:
    """Pack paragraphs into ~size-char chunks; hard-split oversized paragraphs."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    pieces = []
    for p in paragraphs:
        while len(p) > size:
            cut = _word_boundary_cut(p, size)
            pieces.append(p[:cut])
            p = p[_nearest_space_start(p, size - overlap):]
        pieces.append(p)

    chunks = []
    current = ""
    for piece in pieces:
        if current and len(current) + len(piece) + 2 > size:
            chunks.append(current)
            overlap_start = _nearest_space_start(current, len(current) - overlap) if overlap else len(current)
            overlap_text = current[overlap_start:]
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
