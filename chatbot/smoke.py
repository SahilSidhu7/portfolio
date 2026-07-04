# chatbot/smoke.py — live pipeline check with latency breakdown. Not a pytest file.
import sys
import time

from dotenv import load_dotenv

load_dotenv()

import generation  # noqa: E402
import retrieval  # noqa: E402


def run(question: str, store_dir: str = "store"):
    t0 = time.perf_counter()
    store = retrieval.Store.load(store_dir)
    t1 = time.perf_counter()
    candidates = retrieval.search(store, question)
    t2 = time.perf_counter()
    ranked = retrieval.rerank(question, candidates)
    t3 = time.perf_counter()
    print(f"load {t1-t0:.2f}s | retrieve {t2-t1:.2f}s | rerank {t3-t2:.2f}s")
    for chunk, score in ranked:
        print(f"  {score:+.3f}  {chunk['title']}: {chunk['text'][:80]!r}")
    confident = retrieval.passes_gate(ranked)
    lex_score = retrieval.bm25_top(store, question)
    lexical = lex_score >= retrieval.MIN_BM25_SCORE
    evidence = "rerank" if confident else "lexical" if lexical else "none"
    print(f"gate: rerank>={retrieval.MIN_RERANK_SCORE}: {confident} | bm25 {lex_score:.2f}>={retrieval.MIN_BM25_SCORE}: {lexical} | evidence: {evidence}")
    if evidence == "none":
        print("GATED -> refusal")
        return
    prompt = generation.build_prompt(question, [c for c, _ in ranked])
    first = None
    parts = []
    for delta in generation.stream_answer(prompt):
        if first is None:
            first = time.perf_counter()
            print(f"first token {first-t3:.2f}s")
        parts.append(delta)
    print(f"total gen {time.perf_counter()-t3:.2f}s\n\n{''.join(parts)}")


if __name__ == "__main__":
    run(" ".join(sys.argv[1:]) or "What projects have you built?")
