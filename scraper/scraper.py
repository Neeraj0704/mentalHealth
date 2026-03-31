"""
Full WebMD Illinois psychiatry provider scraper.

Flow:
  1. Paginate state listing: /providers/specialty/psychiatry/illinois?pagenumber=N
  2. Collect all unique profile URLs (~72 pages, ~65 per page)
  3. For each profile URL, scrape full provider data
  4. Apply IL-only location filter
  5. Store providers + reviews in webmd.db
"""

import json
import logging
import re
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

BASE = "https://doctor.webmd.com"
STATE_URL = f"{BASE}/providers/specialty/psychiatry/illinois"
DELAY = 2.0


def fetch(page, url, wait=DELAY):
    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    time.sleep(wait)
    return page.content()


def get_profile_urls_from_page(html):
    soup = BeautifulSoup(html, "lxml")
    urls = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if re.search(r"/doctor/.+-[a-f0-9\-]{36}-overview$", href):
            full = href if href.startswith("http") else BASE + href
            if full not in urls:
                urls.append(full)
    return urls


def collect_all_profile_urls(page):
    seen = set()
    profile_urls = []
    page_num = 1
    low_yield_streak = 0  # consecutive pages with very few new profiles

    while True:
        url = f"{STATE_URL}?pagenumber={page_num}"
        log.info("Listing page %d: %s", page_num, url)
        html = fetch(page, url)
        urls = get_profile_urls_from_page(html)

        if not urls:
            log.info("No profiles on page %d — done collecting", page_num)
            break

        new = [u for u in urls if u not in seen]
        seen.update(urls)
        profile_urls.extend(new)
        log.info("  Page %d: %d profiles (%d new, %d total unique)", page_num, len(urls), len(new), len(profile_urls))

        if not new:
            log.info("No new profiles — stopping pagination")
            break

        # Stop if we get 3 consecutive pages with fewer than 5 new profiles
        if len(new) < 5:
            low_yield_streak += 1
            if low_yield_streak >= 3:
                log.info("Low yield for 3 consecutive pages — stopping pagination")
                break
        else:
            low_yield_streak = 0

        page_num += 1

    log.info("Total unique profile URLs: %d", len(profile_urls))
    return profile_urls


# ── Profile parsing ───────────────────────────────────────────────────────────

def get_json_ld(soup):
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string)
            if data.get("@type") == "MedicalWebPage":
                return data
        except Exception:
            pass
    return {}


def safe_text(el):
    return el.get_text(strip=True) if el else None


def parse_profile(html, profile_url):
    soup = BeautifulSoup(html, "lxml")
    jld = get_json_ld(soup)
    entity = jld.get("mainEntity", {})

    name = entity.get("name") or safe_text(soup.select_one("h1"))

    photo = None
    img = entity.get("image", {})
    if isinstance(img, dict):
        photo = img.get("url")

    specialty = None
    med_specs = entity.get("medicalSpecialty", [])
    if med_specs:
        specialty = med_specs[0].get("name") if isinstance(med_specs[0], dict) else med_specs[0]

    agg = entity.get("aggregateRating", {})
    rating = agg.get("ratingValue")
    review_count = agg.get("reviewCount")
    rating_count = review_count

    exp_years = None
    body_text = soup.get_text(" ", strip=True)
    m = re.search(r"(\d+)\s+Years?\s+Experience", body_text, re.IGNORECASE)
    if m:
        exp_years = int(m.group(1))

    phone = None
    tel_link = soup.select_one("a[href^='tel:']")
    if tel_link:
        phone = tel_link.get("href", "").replace("tel:", "").strip()
    if not phone:
        m = re.search(r"\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}", body_text)
        if m:
            phone = m.group(0)

    email = entity.get("email")
    overview = entity.get("description")

    raw_addresses = entity.get("address", [])
    if isinstance(raw_addresses, dict):
        raw_addresses = [raw_addresses]

    locations = []
    for addr in raw_addresses:
        state = addr.get("addressRegion", "").upper().strip()
        if state != "IL":
            continue
        street = addr.get("streetAddress", "")
        city = addr.get("addressLocality", "")
        postal = addr.get("postalCode", "")
        full_address = f"{street}, {city}, {state} {postal}".strip(", ")
        locations.append({
            "clinic_name": addr.get("name"),
            "address": full_address,
            "state": "IL",
            "phone": phone,
            "office_hours": None,
            "virtual_hours": None,
        })

    if not locations:
        log.warning("No IL locations — skipping: %s", profile_url)
        return None, []

    conditions = entity.get("knowsAbout", [])
    specialties_list = [
        s.get("name") if isinstance(s, dict) else s
        for s in entity.get("medicalSpecialty", [])
    ]

    cred = entity.get("hasCredential", {})
    if isinstance(cred, dict):
        education = cred.get("name", [])
        if isinstance(education, str):
            education = [education]
    else:
        education = []

    languages = [
        l.get("name") if isinstance(l, dict) else l
        for l in entity.get("knowsLanguage", [])
    ]
    insurance = entity.get("healthPlanNetworkId", [])

    accepting = "Accepting New Patients" in body_text
    virtual = "Virtual Visit Available" in body_text

    raw_reviews = entity.get("review", [])
    reviews = []
    for rv in raw_reviews:
        reviews.append({
            "provider_profile_url": profile_url,
            "rating": rv.get("reviewRating", {}).get("ratingValue") if isinstance(rv.get("reviewRating"), dict) else rv.get("rating"),
            "review_text": rv.get("reviewBody") or rv.get("description"),
            "review_date": rv.get("datePublished"),
            "reviewer_name": rv.get("author", {}).get("name") if isinstance(rv.get("author"), dict) else rv.get("author"),
        })

    result = {
        "name": name,
        "profile_url": profile_url,
        "photo": photo,
        "specialty": specialty,
        "rating": rating,
        "rating_count": rating_count,
        "review_count": review_count,
        "average_wait_time": None,
        "experience_years": exp_years,
        "phone": phone,
        "email": email,
        "overview": overview,
        "locations": locations,
        "conditions_treated": conditions,
        "specialties": specialties_list,
        "licenses": [],
        "education": education,
        "certifications": [],
        "languages": languages,
        "insurance": insurance,
        "accepting_new_patients": accepting,
        "virtual_visit": virtual,
        "next_available": None,
    }

    return result, reviews


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    db.init_db()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ))

        profile_urls = collect_all_profile_urls(page)

        saved = 0
        skipped = 0
        total_reviews = 0

        for i, url in enumerate(profile_urls, 1):
            log.info("[%d/%d] %s", i, len(profile_urls), url)
            try:
                html = fetch(page, url)
                provider, reviews = parse_profile(html, url)
                if provider:
                    db.insert_provider(provider)
                    for rv in reviews:
                        db.insert_review(rv)
                    total_reviews += len(reviews)
                    saved += 1
                    log.info("  ✓ %s | %d IL locations | %d reviews", provider["name"], len(provider["locations"]), len(reviews))
                else:
                    skipped += 1
            except Exception as e:
                log.error("  ✗ Error: %s — %s", url, e)
                skipped += 1

        browser.close()

    log.info("Done. Saved: %d | Skipped: %d | Reviews: %d", saved, skipped, total_reviews)


if __name__ == "__main__":
    main()
