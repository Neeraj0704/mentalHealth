"""
RateMDs overnight scraper — discovers profile URLs across IL cities,
fuzzy-matches against existing providers, scrapes reviews, ingests to ratemds_test.db.

Writes ONLY to ratemds_test.db. webmd.db is never touched.
Restart-safe: checkpoints discovered URLs and processed profiles to disk.
"""

import json
import re
import sqlite3
import time
import random
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from rapidfuzz import fuzz, process

# -------------------------------------------------------
# PATHS
# -------------------------------------------------------
ROOT = Path(__file__).parent.parent
TEST_DB       = ROOT / "ratemds_test.db"
URLS_FILE     = ROOT / "pipeline" / "discovered_urls.txt"
DONE_FILE     = ROOT / "pipeline" / "processed_profiles.txt"
UNMATCHED_LOG = ROOT / "pipeline" / "ratemds_unmatched.log"
ERROR_LOG     = ROOT / "pipeline" / "ratemds_errors.log"

# -------------------------------------------------------
# CONFIG
# -------------------------------------------------------
MATCH_THRESHOLD = 85
PAGE_DELAY  = (5, 9)    # seconds between listing page requests (random range)
PROFILE_DELAY = (2, 4)  # seconds between profile page requests

IL_CITIES = [
    "chicago", "springfield", "rockford", "naperville", "aurora",
    "peoria", "elgin", "joliet", "waukegan", "champaign", "bloomington",
    "decatur", "schaumburg", "evanston", "skokie", "oak-park",
    "arlington-heights", "bolingbrook", "palatine", "round-lake-beach",
    "tinley-park", "orland-park", "normal", "berwyn", "downers-grove",
    "hoffman-estates", "oak-lawn", "mount-prospect", "glenview", "wheaton",
]

SPECIALTIES = ["psychiatrist", "psychologist"]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

CREDENTIAL_RE = re.compile(
    r",?\s*(MD|DO|PhD|PsyD|LCSW|LMFT|LPC|LMHC|DNP|PMHNP-BC|PMHNP|NP|MSW|"
    r"APRN|RN|MS|MA|LCPC|CADC|MFT|EdD|BCBA|MBA|MPH|DDS|DMD|DC|DVM)(\s*,.*)?$",
    re.IGNORECASE,
)
DATE_RE = re.compile(r"^[A-Z][a-z]+ \d{1,2}, \d{4}$")


def strip_credentials(name: str) -> str:
    return CREDENTIAL_RE.sub("", name).strip()


def sleep_random(lo, hi):
    time.sleep(random.uniform(lo, hi))


# -------------------------------------------------------
# PHASE 1: DISCOVER PROFILE URLS
# -------------------------------------------------------

def fetch_listing_page(url: str, retries: int = 3) -> str | None:
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            print(f"    [{r.status_code}] {url} (attempt {attempt+1})")
        except Exception as e:
            print(f"    [ERR] {url}: {e} (attempt {attempt+1})")
        if attempt < retries - 1:
            time.sleep(random.uniform(8, 15))  # longer backoff on failure
    return None


def discover_urls() -> set:
    if URLS_FILE.exists():
        existing = set(URLS_FILE.read_text().splitlines())
        print(f"Loaded {len(existing)} previously discovered URLs from checkpoint.")
        return existing

    all_urls = set()

    for specialty in SPECIALTIES:
        for city in IL_CITIES:
            base = f"https://www.ratemds.com/best-doctors/il/{city}/{specialty}/"
            page = 1
            consecutive_empty = 0

            while True:
                url = base if page == 1 else f"{base}?page={page}"
                html = fetch_listing_page(url)

                if html is None:
                    consecutive_empty += 1
                    if consecutive_empty >= 2:
                        break
                    page += 1
                    sleep_random(*PAGE_DELAY)
                    continue

                soup = BeautifulSoup(html, "lxml")
                links = set([
                    "https://www.ratemds.com" + a["href"].split("#")[0]
                    for a in soup.find_all("a", href=True)
                    if "/doctor-ratings/" in a["href"] and "#" not in a["href"].split("/doctor-ratings/")[1][:5]
                ])

                # Normalize — remove fragment duplicates
                links = set([l.split("#")[0].rstrip("/") + "/" for l in links])

                if not links:
                    consecutive_empty += 1
                    if consecutive_empty >= 2:
                        print(f"  {specialty}/{city}: stopped at page {page} (empty)")
                        break
                    page += 1
                    sleep_random(*PAGE_DELAY)
                    continue

                consecutive_empty = 0
                new = links - all_urls
                all_urls |= links
                print(f"  {specialty}/{city} p{page}: +{len(new)} urls (total={len(all_urls)})")

                # Check if there's a next page
                page_links = [a["href"] for a in soup.find_all("a", href=True) if "page=" in a.get("href", "")]
                max_page = max([int(re.search(r"page=(\d+)", p).group(1)) for p in page_links if re.search(r"page=(\d+)", p)], default=page)

                if page >= max_page:
                    print(f"  {specialty}/{city}: done ({page} pages)")
                    break

                page += 1
                sleep_random(*PAGE_DELAY)

    URLS_FILE.write_text("\n".join(sorted(all_urls)))
    print(f"\nDiscovered {len(all_urls)} unique profile URLs → saved to {URLS_FILE.name}")
    return all_urls


# -------------------------------------------------------
# PHASE 2: SCRAPE PROFILE
# -------------------------------------------------------

def scrape_profile(url: str) -> dict | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "lxml")

        name_tag = soup.find("h3", class_="provider-name")
        raw_name = name_tag.get_text(strip=True) if name_tag else ""
        name = re.sub(r"^Ratings\s*for\s*", "", raw_name).strip()
        if not name:
            return None

        overall_tag = soup.find("span", class_="rating-average")
        overall_rating = float(overall_tag.get_text(strip=True)) if overall_tag else None

        reviews = []
        seen = set()
        for block in soup.find_all("div", class_="rating"):
            star = block.find("div", class_="star-rating")
            rating = float(star["title"]) if star and star.get("title") else None
            body = block.find("p", class_="reviewBody")
            text = body.get_text(strip=True) if body else ""
            if not text:
                continue
            key = text.lower().strip()
            if key in seen:
                continue
            seen.add(key)
            review_date = None
            for t in block.stripped_strings:
                if DATE_RE.match(t.strip()):
                    review_date = t.strip()
                    break
            reviews.append({"rating": rating, "review_text": text, "review_date": review_date})

        return {"url": url, "name": name, "name_clean": strip_credentials(name), "overall_rating": overall_rating, "reviews": reviews}

    except Exception as e:
        with open(ERROR_LOG, "a") as f:
            f.write(f"SCRAPE_ERR\t{url}\t{e}\n")
        return None


# -------------------------------------------------------
# PHASE 3: MATCH + INGEST
# -------------------------------------------------------

def get_il_providers(conn):
    rows = conn.execute(
        "SELECT id, name, locations FROM providers "
        "WHERE locations LIKE '%\"state\": \"IL\"%' OR locations LIKE '%\"state\":\"IL\"%'"
    ).fetchall()
    result = []
    for r in rows:
        if not r["name"]:
            continue
        # Extract city names from locations JSON for city validation
        cities = set()
        try:
            locs = json.loads(r["locations"] or "[]")
            for loc in locs:
                c = (loc.get("city") or "").lower().strip()
                if c:
                    cities.add(c)
        except Exception:
            pass
        result.append((r["id"], r["name"], strip_credentials(r["name"]), cities))
    return result


def extract_city_from_url(url: str) -> str:
    """Extract city from RateMDs URL slug e.g. .../Dr-Amy-Miller-Schaumburg-IL.html/ → schaumburg"""
    m = re.search(r"/Dr-[^/]+-([A-Za-z+]+)-[A-Z]{2}\.html", url)
    if m:
        return m.group(1).replace("+", " ").lower().strip()
    return ""


def city_matches(ratemds_city: str, provider_cities: set) -> bool:
    """True if ratemds city loosely matches any of the provider's known cities."""
    if not ratemds_city or not provider_cities:
        return True  # can't verify → don't reject
    for pc in provider_cities:
        if ratemds_city in pc or pc in ratemds_city:
            return True
    return False


def fuzzy_match(name_clean: str, ratemds_url: str, candidates: list) -> dict | None:
    ratemds_city = extract_city_from_url(ratemds_url)

    results = process.extract(name_clean, [c[2] for c in candidates], scorer=fuzz.token_sort_ratio, limit=5)
    if not results:
        return None

    for matched_name, score, idx in results:
        if score < MATCH_THRESHOLD:
            break
        provider_id, full_name, _, provider_cities = candidates[idx]
        if city_matches(ratemds_city, provider_cities):
            return {"provider_id": provider_id, "name": full_name, "similarity": round(score, 1)}

    return None


def review_exists(conn, provider_id: int, review_text: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM reviews WHERE provider_id = ? AND review_text = ? LIMIT 1",
        (provider_id, review_text),
    ).fetchone() is not None


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

def main():
    print("=" * 60)
    print("  RATEMDS OVERNIGHT SCRAPER")
    print(f"  DB: {TEST_DB.name} (webmd.db untouched)")
    print("=" * 60)

    # Phase 1: discover
    print("\n[PHASE 1] Discovering profile URLs from listing pages...\n")
    all_urls = discover_urls()

    # Load already-processed
    done = set()
    if DONE_FILE.exists():
        done = set(DONE_FILE.read_text().splitlines())
    pending = [u for u in sorted(all_urls) if u not in done]
    print(f"\n[PHASE 2+3] Processing {len(pending)} profiles ({len(done)} already done)...\n")

    conn = sqlite3.connect(TEST_DB)
    conn.row_factory = sqlite3.Row
    candidates = get_il_providers(conn)
    print(f"Loaded {len(candidates)} IL providers for matching.\n")

    matched_total = 0
    unmatched_total = 0
    inserted_total = 0
    skipped_total = 0

    for i, url in enumerate(pending, 1):
        profile = scrape_profile(url)
        sleep_random(*PROFILE_DELAY)

        if not profile or not profile["name"]:
            with open(DONE_FILE, "a") as f:
                f.write(url + "\n")
            continue

        match = fuzzy_match(profile["name_clean"], url, candidates)

        if not match:
            unmatched_total += 1
            with open(UNMATCHED_LOG, "a") as f:
                f.write(f"{profile['name']}\t{url}\n")
            with open(DONE_FILE, "a") as f:
                f.write(url + "\n")
            if i % 50 == 0:
                print(f"  [{i}/{len(pending)}] {profile['name']} — no match")
            continue

        matched_total += 1
        pid = match["provider_id"]
        inserted = 0
        skipped = 0

        for r in profile["reviews"]:
            if not r["review_text"]:
                continue
            if review_exists(conn, pid, r["review_text"]):
                skipped += 1
                skipped_total += 1
                continue
            conn.execute(
                "INSERT INTO reviews (provider_id, provider_profile_url, rating, review_text, review_date, reviewer_name, source) VALUES (?,?,?,?,?,?,?)",
                (pid, url, r["rating"], r["review_text"], r["review_date"], "RateMDs Patient", "ratemds"),
            )
            inserted += 1
            inserted_total += 1

        conn.commit()

        with open(DONE_FILE, "a") as f:
            f.write(url + "\n")

        if inserted > 0 or i % 25 == 0:
            print(f"  [{i}/{len(pending)}] {profile['name']} → id={pid} score={match['similarity']} | +{inserted} reviews ({skipped} skipped)")

    conn.close()

    print(f"\n{'=' * 60}")
    print(f"  URLs discovered    : {len(all_urls)}")
    print(f"  Profiles processed : {len(pending)}")
    print(f"  Matched            : {matched_total}")
    print(f"  Unmatched          : {unmatched_total}")
    print(f"  Reviews inserted   : {inserted_total}")
    print(f"  Reviews skipped    : {skipped_total} (already existed)")
    print(f"{'=' * 60}")
    print(f"  webmd.db           : UNTOUCHED")
    print(f"  ratemds_test.db    : updated")


if __name__ == "__main__":
    main()
