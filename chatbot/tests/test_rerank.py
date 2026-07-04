import retrieval
from retrieval import rerank, passes_gate, bm25_top, build_indexes, Store
from tests.test_retrieval import fake_embed, CHUNKS as STORE_CHUNKS

CHUNKS = [
    {"id": 0, "text": "We build AI chatbots.", "source": "a", "title": "Home"},
    {"id": 1, "text": "The service costs $99 per month.", "source": "b", "title": "Pricing"},
]


def test_bm25_top_scores_lexical_overlap(tmp_path):
    store_dir = str(tmp_path / "store")
    build_indexes(STORE_CHUNKS, store_dir=store_dir, embed=fake_embed)
    store = Store.load(store_dir)
    assert bm25_top(store, "chatbot cost month") > 0
    assert bm25_top(store, "elephants zebra giraffe") == 0.0


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
