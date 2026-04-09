"""
RateMDs ingest — matches scraped profiles to providers in ratemds_test.db
and inserts reviews. Writes ONLY to ratemds_test.db, never webmd.db.
"""

import sqlite3
from pathlib import Path
from rapidfuzz import fuzz, process

from ratemds_scraper import scrape_many, strip_credentials

TEST_DB = Path(__file__).parent.parent / "ratemds_test.db"
UNMATCHED_LOG = Path(__file__).parent / "ratemds_unmatched.log"
MATCH_THRESHOLD = 85

# Test URLs — extend this list to scrape more profiles
RATEMDS_URLS = [
    "https://www.ratemds.com/doctor-ratings/15807/Dr-Mojgan-Makki-Chicago-IL.html/",
]


def get_il_providers(conn: sqlite3.Connection) -> list[tuple]:
    rows = conn.execute(
        "SELECT id, name FROM providers "
        "WHERE locations LIKE '%\"state\": \"IL\"%' OR locations LIKE '%\"state\":\"IL\"%'"
    ).fetchall()
    return [(row["id"], row["name"], strip_credentials(row["name"])) for row in rows if row["name"]]


def fuzzy_match(name_clean: str, candidates: list[tuple]) -> dict | None:
    results = process.extract(
        name_clean,
        [c[2] for c in candidates],
        scorer=fuzz.token_sort_ratio,
        limit=1,
    )
    if not results:
        return None
    _, score, idx = results[0]
    if score < MATCH_THRESHOLD:
        return None
    return {
        "provider_id": candidates[idx][0],
        "name": candidates[idx][1],
        "similarity": round(score, 1),
    }


def review_exists(conn: sqlite3.Connection, provider_id: int, review_text: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM reviews WHERE provider_id = ? AND review_text = ? LIMIT 1",
        (provider_id, review_text),
    ).fetchone()
    return row is not None


def ingest(urls: list[str] = None):
    if urls is None:
        urls = RATEMDS_URLS

    conn = sqlite3.connect(TEST_DB)
    conn.row_factory = sqlite3.Row

    print(f"Connected to: {TEST_DB.name}")
    print(f"Scraping {len(urls)} RateMDs profile(s)...\n")

    profiles = scrape_many(urls)
    candidates = get_il_providers(conn)

    matched = 0
    unmatched = 0
    inserted = 0
    skipped = 0

    for profile in profiles:
        match = fuzzy_match(profile["name_clean"], candidates)

        if not match:
            print(f"  NO MATCH: {profile['name']} ({profile['url']})")
            unmatched += 1
            with open(UNMATCHED_LOG, "a") as f:
                f.write(f"{profile['name']}\t{profile['url']}\n")
            continue

        matched += 1
        provider_id = match["provider_id"]
        print(f"  MATCHED: {profile['name']} → {match['name']} (id={provider_id}, score={match['similarity']})")

        for r in profile["reviews"]:
            if not r["review_text"]:
                continue
            if review_exists(conn, provider_id, r["review_text"]):
                skipped += 1
                continue
            conn.execute(
                """INSERT INTO reviews
                   (provider_id, provider_profile_url, rating, review_text, review_date, reviewer_name, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    provider_id,
                    profile["url"],
                    r["rating"],
                    r["review_text"],
                    r["review_date"],
                    "RateMDs Patient",
                    "ratemds",
                ),
            )
            inserted += 1

        conn.commit()

    conn.close()

    print(f"\n{'='*50}")
    print(f"  Profiles scraped  : {len(profiles)}")
    print(f"  Matched           : {matched}")
    print(f"  Unmatched         : {unmatched}")
    print(f"  Reviews inserted  : {inserted}")
    print(f"  Reviews skipped   : {skipped} (already exist)")
    print(f"{'='*50}")
    print(f"  webmd.db          : UNTOUCHED")
    print(f"  ratemds_test.db   : updated")


if __name__ == "__main__":
    ingest()
