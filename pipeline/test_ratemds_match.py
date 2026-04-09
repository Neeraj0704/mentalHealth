"""
Dry-run test: scrape one RateMDs profile, fuzzy-match against webmd.db providers.
NO database writes. READ-ONLY on webmd.db.
"""

import json
import re
import sqlite3
import requests
from bs4 import BeautifulSoup
from rapidfuzz import fuzz, process
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "webmd.db"
TARGET_URL = "https://www.ratemds.com/doctor-ratings/15807/Dr-Mojgan-Makki-Chicago-IL.html/"
MATCH_THRESHOLD = 85


# --------------------------------------------------
# STEP 1: SCRAPE RATEMDS
# --------------------------------------------------

def scrape_ratemds(url: str) -> dict:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    # Doctor name — h3.provider-name contains "Ratings for Dr. X"
    name_tag = soup.find("h3", class_="provider-name")
    raw_name = name_tag.get_text(strip=True) if name_tag else ""
    name = re.sub(r"^Ratings\s*for\s*", "", raw_name).strip()

    # Overall rating
    overall_tag = soup.find("span", class_="rating-average")
    overall_rating = float(overall_tag.get_text(strip=True)) if overall_tag else None

    # Location — from URL slug (city-state) as fallback
    location = ""
    loc_match = re.search(r"-([A-Za-z]+)-([A-Z]{2})\.html", url)
    if loc_match:
        location = f"{loc_match.group(1)}, {loc_match.group(2)}"

    # Reviews — each lives in div.rating
    review_blocks = soup.find_all("div", class_="rating")
    raw_reviews = []

    for block in review_blocks:
        # Per-review rating from star-rating div title attribute
        star_div = block.find("div", class_="star-rating")
        rating = float(star_div["title"]) if star_div and star_div.get("title") else None

        # Review text
        body_tag = block.find("p", class_="reviewBody")
        review_text = body_tag.get_text(strip=True) if body_tag else ""
        if not review_text:
            continue

        # Date — appears as bare text node after the vote section
        # Strategy: walk all stripped strings, find one matching "Month DD, YYYY"
        review_date = None
        date_pattern = re.compile(r"^[A-Z][a-z]+ \d{1,2}, \d{4}$")
        for txt in block.stripped_strings:
            if date_pattern.match(txt.strip()):
                review_date = txt.strip()
                break

        raw_reviews.append({
            "rating": rating,
            "review_text": review_text,
            "review_date": review_date,
        })

    # Deduplicate by normalized text (lowercase + stripped)
    seen = set()
    reviews = []
    for r in raw_reviews:
        key = r["review_text"].lower().strip()
        if key not in seen:
            seen.add(key)
            reviews.append(r)

    return {
        "name": name,
        "location": location,
        "overall_rating": overall_rating,
        "raw_count": len(raw_reviews),
        "reviews": reviews,
    }


# --------------------------------------------------
# STEP 2: FUZZY MATCH AGAINST WEBMD DB
# --------------------------------------------------

def match_provider(scraped_name: str, conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        "SELECT id, name FROM providers WHERE locations LIKE '%\"state\": \"IL\"%' OR locations LIKE '%\"state\":\"IL\"%'"
    ).fetchall()

    CREDENTIAL_SUFFIXES = re.compile(
        r",?\s*(MD|DO|PhD|PsyD|LCSW|LMFT|LPC|LMHC|DNP|PMHNP-BC|PMHNP|NP|MSW|"
        r"APRN|RN|MS|MA|LCPC|CADC|MFT|EdD|BCBA|MBA|MPH|DDS|DMD|DC|DVM)(\s*,.*)?$",
        re.IGNORECASE,
    )

    def strip_credentials(name: str) -> str:
        return CREDENTIAL_SUFFIXES.sub("", name).strip()

    candidates = [(row["id"], row["name"], strip_credentials(row["name"])) for row in rows if row["name"]]
    scraped_clean = strip_credentials(scraped_name)

    results = process.extract(
        scraped_clean,
        [c[2] for c in candidates],
        scorer=fuzz.token_sort_ratio,
        limit=3,
    )

    matches = []
    for _, score, idx in results:
        matches.append({
            "provider_id": candidates[idx][0],
            "name": candidates[idx][1],
            "similarity": round(score, 1),
        })

    return matches


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    print("=" * 60)
    print("  RATEMDS DRY-RUN INTEGRATION TEST")
    print("  NO DB WRITES — READ-ONLY")
    print("=" * 60)

    # Step 1: Scrape
    print(f"\n[1] Scraping: {TARGET_URL}\n")
    data = scrape_ratemds(TARGET_URL)

    print(f"  Doctor name     : {data['name']}")
    print(f"  Location        : {data['location'] or 'Not found'}")
    print(f"  Overall rating  : {data['overall_rating']}")
    print(f"  Raw reviews     : {data['raw_count']}")
    print(f"  After dedup     : {len(data['reviews'])}")

    # Step 2: Match
    print(f"\n[2] Fuzzy matching against webmd.db (IL only, threshold={MATCH_THRESHOLD})...\n")
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    matches = match_provider(data["name"], conn)

    print("  Top 3 candidates:")
    for i, m in enumerate(matches, 1):
        flag = "✅" if m["similarity"] >= MATCH_THRESHOLD else "❌ (below threshold)"
        print(f"    {i}. {m['name']} (id={m['provider_id']}, score={m['similarity']}) {flag}")

    best = matches[0] if matches and matches[0]["similarity"] >= MATCH_THRESHOLD else None

    print(f"\n  Final match: ", end="")
    if best:
        print(f"{best['name']} (id={best['provider_id']}, score={best['similarity']})")
    else:
        print("No match found above threshold.")

    conn.close()

    # Step 3: Sample reviews
    print(f"\n[3] First 3 cleaned reviews:\n")
    for i, r in enumerate(data["reviews"][:3], 1):
        print(f"  Review {i}:")
        print(f"    rating : {r['rating']}")
        print(f"    date   : {r['review_date']}")
        print(f"    text   : {r['review_text'][:200]}")
        print()

    # Step 4: Simulated insert payload
    print(f"[4] Simulated insert payload (DRY RUN — not written to DB):\n")
    payload = {
        "provider_id": best["provider_id"] if best else None,
        "source": "ratemds",
        "matched_name": best["name"] if best else None,
        "similarity_score": best["similarity"] if best else None,
        "reviews": data["reviews"],
    }
    print(json.dumps(payload, indent=2))

    print("\n" + "=" * 60)
    print("  DRY RUN COMPLETE — nothing written to DB")
    print("=" * 60)


if __name__ == "__main__":
    main()
