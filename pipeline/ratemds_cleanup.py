"""
Cleanup script — removes false positive RateMDs reviews from ratemds_test.db
by validating city match between the RateMDs URL and the provider's known locations.

Run AFTER the overnight scraper finishes. Read-only on webmd.db. Safe to re-run.
"""

import json
import re
import sqlite3
from pathlib import Path

TEST_DB = Path(__file__).parent.parent / "ratemds_test.db"


def extract_city_from_url(url: str) -> str:
    m = re.search(r"/Dr-[^/]+-([A-Za-z+]+)-[A-Z]{2}\.html", url)
    if m:
        return m.group(1).replace("+", " ").lower().strip()
    return ""


def city_matches(ratemds_city: str, provider_cities: set) -> bool:
    if not ratemds_city or not provider_cities:
        return True  # can't verify → keep
    for pc in provider_cities:
        if ratemds_city in pc or pc in ratemds_city:
            return True
    return False


def main():
    conn = sqlite3.connect(TEST_DB)
    conn.row_factory = sqlite3.Row

    # Get all ratemds reviews with their provider's locations
    rows = conn.execute("""
        SELECT r.id, r.provider_id, r.provider_profile_url, p.name, p.locations
        FROM reviews r
        JOIN providers p ON p.id = r.provider_id
        WHERE r.source = 'ratemds'
    """).fetchall()

    print(f"Checking {len(rows)} RateMDs reviews for city validation...\n")

    to_delete = []
    for row in rows:
        ratemds_city = extract_city_from_url(row["provider_profile_url"] or "")

        provider_cities = set()
        try:
            locs = json.loads(row["locations"] or "[]")
            for loc in locs:
                c = (loc.get("city") or "").lower().strip()
                if c:
                    provider_cities.add(c)
        except Exception:
            pass

        if not city_matches(ratemds_city, provider_cities):
            to_delete.append((row["id"], row["name"], ratemds_city, provider_cities))

    print(f"False positives found: {len(to_delete)}")
    for rid, name, rc, pc in to_delete[:20]:
        print(f"  review_id={rid} | provider={name} | ratemds_city={rc} | provider_cities={pc}")

    if not to_delete:
        print("No false positives — DB is clean.")
        conn.close()
        return

    confirm = input(f"\nDelete {len(to_delete)} false positive reviews? (yes/no): ").strip().lower()
    if confirm == "yes":
        ids = [r[0] for r in to_delete]
        conn.execute(f"DELETE FROM reviews WHERE id IN ({','.join('?' * len(ids))})", ids)
        conn.commit()
        print(f"Deleted {len(to_delete)} reviews.")
    else:
        print("Aborted — nothing deleted.")

    conn.close()


if __name__ == "__main__":
    main()
