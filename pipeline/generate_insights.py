import argparse
import json
import sqlite3
import time
import requests
from pathlib import Path

from prompts import build_prompt
from schema import ProviderInsight

DB_PATH = Path(__file__).parent.parent / "webmd.db"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"
ERROR_LOG = Path(__file__).parent / "pipeline_errors.log"


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_insights_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS provider_insights (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id     INTEGER UNIQUE REFERENCES providers(id),
            profile_summary TEXT,
            review_summary  TEXT,
            pros            TEXT,
            cons            TEXT,
            sentiment_score REAL,
            model_used      TEXT,
            model_version   TEXT,
            processed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()


def call_ollama(prompt: str) -> dict:
    resp = requests.post(OLLAMA_URL, json={
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2},
    }, timeout=60)
    resp.raise_for_status()
    return json.loads(resp.json()["response"])


def safe_call_ollama(prompt: str, retries: int = 2) -> dict:
    for i in range(retries):
        try:
            return call_ollama(prompt)
        except Exception as e:
            if i == retries - 1:
                raise


def clean_list(values: list[str]) -> list[str]:
    junk = {"none", "none found", "n/a", "not applicable", "not found"}
    return [v for v in values if v and v.lower().strip() not in junk]


def log_error(provider_id: int, e: Exception):
    with open(ERROR_LOG, "a") as f:
        f.write(f"{provider_id}\t{type(e).__name__}: {e}\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Max providers to process (for testing)")
    args = parser.parse_args()

    conn = get_connection()
    init_insights_table(conn)

    pending = conn.execute("""
        SELECT id, name, overview FROM providers
        WHERE id NOT IN (SELECT provider_id FROM provider_insights)
        ORDER BY id
    """).fetchall()

    if args.limit:
        pending = pending[:args.limit]

    total = len(pending)
    print(f"Processing {total} providers...")

    for idx, row in enumerate(pending, 1):
        provider_id = row["id"]
        name = row["name"] or f"Provider {provider_id}"
        overview = row["overview"] or ""

        reviews = conn.execute(
            "SELECT review_text, rating FROM reviews WHERE provider_id = ? LIMIT 15",
            (provider_id,)
        ).fetchall()
        reviews = [dict(r) for r in reviews]
        has_reviews = len(reviews) > 0

        if not overview.strip() and not reviews:
            print(f"[{idx}/{total}] {name} — skipped (no data)")
            log_error(provider_id, ValueError("no overview and no reviews"))
            continue

        prompt = build_prompt(overview, reviews)

        try:
            raw = safe_call_ollama(prompt)
        except Exception as e:
            print(f"[{idx}/{total}] {name} — ERROR (ollama): {e}")
            log_error(provider_id, e)
            continue

        try:
            validated = ProviderInsight(**raw)
        except Exception:
            validated = ProviderInsight()

        # Fix 3: force no-review logic — pipeline is source of truth, not LLM
        if not has_reviews:
            validated.review_summary = "No patient reviews available."
            validated.pros = []
            validated.cons = []
            validated.sentiment_score = 0.5

        # Fix 1: strip junk values LLM may produce
        pros = clean_list(validated.pros)
        cons = clean_list(validated.cons)

        conn.execute("""
            INSERT INTO provider_insights
                (provider_id, profile_summary, review_summary, pros, cons, sentiment_score, model_used, model_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            provider_id,
            validated.profile_summary,
            validated.review_summary,
            json.dumps(pros),
            json.dumps(cons),
            validated.sentiment_score,
            MODEL,
            MODEL,
        ))
        conn.commit()

        print(f"[{idx}/{total}] {name} — done (sentiment: {validated.sentiment_score:.2f})")
        time.sleep(0.2)

    conn.close()
    print("Pipeline complete.")


if __name__ == "__main__":
    main()
