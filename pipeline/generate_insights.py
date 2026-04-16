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

DEBUG = False
DRY_RUN = False


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


def clean_reviews(reviews: list[dict]) -> list[dict]:
    return [r for r in reviews if r.get("review_text") and r["review_text"].strip()]


def log_error(provider_id: int, e: Exception):
    with open(ERROR_LOG, "a") as f:
        f.write(f"{provider_id}\t{type(e).__name__}: {e}\n")


def select_test_providers(conn) -> list:
    high = conn.execute("""
        SELECT id, name, overview, review_count FROM providers
        WHERE review_count > 5
        AND id NOT IN (SELECT provider_id FROM provider_insights)
        ORDER BY RANDOM() LIMIT 3
    """).fetchall()

    low = conn.execute("""
        SELECT id, name, overview, review_count FROM providers
        WHERE review_count BETWEEN 1 AND 3
        AND id NOT IN (SELECT provider_id FROM provider_insights)
        ORDER BY RANDOM() LIMIT 3
    """).fetchall()

    none = conn.execute("""
        SELECT id, name, overview, review_count FROM providers
        WHERE review_count = 0
        AND id NOT IN (SELECT provider_id FROM provider_insights)
        ORDER BY RANDOM() LIMIT 2
    """).fetchall()

    random = conn.execute("""
        SELECT id, name, overview, review_count FROM providers
        WHERE id NOT IN (SELECT provider_id FROM provider_insights)
        ORDER BY RANDOM() LIMIT 2
    """).fetchall()

    return list(high) + list(low) + list(none) + list(random)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run-test", action="store_true", help="Run controlled test selection of 10 providers")
    args = parser.parse_args()

    conn = get_connection()
    init_insights_table(conn)

    if args.dry_run_test:
        pending = select_test_providers(conn)
        print(f"DRY RUN TEST — {len(pending)} providers selected (NO DB writes)\n")
        print(f"  3 with review_count > 5")
        print(f"  3 with review_count 1–3")
        print(f"  2 with no reviews")
        print(f"  2 random\n")
    else:
        pending = conn.execute("""
            SELECT id, name, overview FROM providers
            WHERE id NOT IN (SELECT provider_id FROM provider_insights)
            ORDER BY id
        """).fetchall()
        if args.limit:
            pending = pending[:args.limit]

    total = len(pending)
    if not args.dry_run_test:
        print(f"Processing {total} providers...")

    for idx, row in enumerate(pending, 1):
        provider_id = row["id"]
        name = row["name"] or f"Provider {provider_id}"
        overview = row["overview"] or ""
        review_count = row["review_count"] if "review_count" in row.keys() else "?"

        reviews = conn.execute(
            "SELECT review_text, rating FROM reviews WHERE provider_id = ? LIMIT 15",
            (provider_id,)
        ).fetchall()
        reviews = clean_reviews([dict(r) for r in reviews])
        has_reviews = len(reviews) > 0

        if DEBUG and args.dry_run_test:
            print("=" * 60)
            print(f"[{idx}/{total}] {name}")
            print(f"  review_count in DB : {review_count}")
            print(f"  reviews fetched    : {len(reviews)}")
            print(f"  has_reviews        : {has_reviews}")

        if not overview.strip() and not reviews:
            print(f"  -> SKIPPED (no overview, no reviews)")
            log_error(provider_id, ValueError("no overview and no reviews"))
            continue

        prompt = build_prompt(overview, reviews)

        try:
            raw = safe_call_ollama(prompt)
        except Exception as e:
            print(f"  -> ERROR (ollama): {e}")
            log_error(provider_id, e)
            continue

        try:
            validated = ProviderInsight(**raw)
        except Exception:
            validated = ProviderInsight()

        # Force no-review logic — pipeline is source of truth, not LLM
        if not has_reviews:
            validated.review_summary = "No patient reviews available."
            validated.pros = []
            validated.cons = []
            validated.sentiment_score = 0.5

        pros = clean_list(validated.pros)
        cons = clean_list(validated.cons)

        if DEBUG and args.dry_run_test:
            print(f"  profile_summary : {validated.profile_summary}")
            print(f"  review_summary  : {validated.review_summary}")
            print(f"  pros            : {pros}")
            print(f"  cons            : {cons}")
            print(f"  sentiment_score : {validated.sentiment_score}")

        if not DRY_RUN:
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
        else:
            if not args.dry_run_test:
                print(f"[{idx}/{total}] {name} — DRY RUN: Skipping DB insert")

        time.sleep(0.2)

    conn.close()
    print("\nPipeline complete." if not args.dry_run_test else "\nDry run complete. No data written to DB.")


if __name__ == "__main__":
    main()
