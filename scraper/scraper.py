"""
Full WebMD Illinois psychiatry provider scraper.

Usage:
  python scraper.py

Flow:
  1. Paginate state listing: /providers/specialty/psychiatry/illinois?pagenumber=N
  2. Collect all unique profile URLs
  3. For each profile URL, scrape full provider data
  4. Apply IL-only location filter
  5. Store providers + reviews in webmd.db
  6. Update review_count with actual scraped count
"""

import argparse
import json
import logging
import re
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import db

BASE = "https://doctor.webmd.com"
DELAY = 2.0

log = logging.getLogger(__name__)


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


def collect_all_profile_urls(page, state_url, max_pages=None):
    seen = set()
    profile_urls = []
    page_num = 1
    low_yield_streak = 0

    while True:
        url = f"{state_url}?pagenumber={page_num}"
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

        if max_pages and page_num >= max_pages:
            log.info("Reached max-pages limit (%d) — stopping pagination", max_pages)
            break

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

    # ---- Basic Info ----
    name = entity.get("name") or safe_text(soup.select_one("h1"))

    photo = None
    img = entity.get("image", {})
    if isinstance(img, dict):
        photo = img.get("url")

    specialty = None
    med_specs = entity.get("medicalSpecialty", [])
    if med_specs:
        specialty = med_specs[0].get("name") if isinstance(med_specs[0], dict) else med_specs[0]

    # ---- Ratings ----
    agg = entity.get("aggregateRating", {})
    rating = agg.get("ratingValue")
    rating_count = agg.get("reviewCount")

    # ---- Experience ----
    exp_years = None
    body_text = soup.get_text(" ", strip=True)
    m = re.search(r"(\d+)\s+Years?\s+Experience", body_text, re.IGNORECASE)
    if m:
        exp_years = int(m.group(1))

    # ---- Contact ----
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

    # ---- Average Wait Time ----
    average_wait_time = safe_text(soup.select_one("dl.avg-wait-time dd"))

    # ---- Locations — IL only, with split address fields ----
    raw_addresses = entity.get("address", [])
    if isinstance(raw_addresses, dict):
        raw_addresses = [raw_addresses]

    locations = []
    for addr in raw_addresses:
        state = addr.get("addressRegion", "").upper().strip()
        if state != "IL":
            continue
        street = addr.get("streetAddress") or None
        city = addr.get("addressLocality") or None
        zipcode = addr.get("postalCode") or None
        parts = [p for p in [street, city, f"{state} {zipcode}".strip() if zipcode else state] if p]
        full_address = ", ".join(parts) if parts else None
        locations.append({
            "clinic_name": addr.get("name") or None,
            "street": street,
            "city": city,
            "state": "IL",
            "zipcode": zipcode,
            "full_address": full_address,
            "phone": phone,
            "office_hours": None,
            "virtual_hours": None,
        })

    if not locations:
        log.warning("No IL locations — skipping: %s", profile_url)
        return None, []

    # ---- Medical Info ----
    conditions = entity.get("knowsAbout", [])
    specialties_list = [
        s.get("name") if isinstance(s, dict) else s
        for s in entity.get("medicalSpecialty", [])
    ]

    # ---- Licenses & Education from HTML ----
    licenses = []
    education = []
    for sec in soup.select("div.education-subsection"):
        sec_text = sec.get_text(" ", strip=True).upper()
        wrappers = [w.get_text(" ", strip=True) for w in sec.select("div.education-wrapper") if w.get_text(strip=True)]
        if "LICENSE" in sec_text:
            licenses.extend(wrappers)
        else:
            education.extend(wrappers)

    # ---- Additional Info ----
    languages = [
        l.get("name") if isinstance(l, dict) else l
        for l in entity.get("knowsLanguage", [])
    ]
    insurance = entity.get("healthPlanNetworkId", [])

    # ---- Availability from topcard HTML ----
    new_patient_el = soup.select_one("span.new-patient-info")
    accepting = new_patient_el is not None and "Accepting New Patients" in new_patient_el.get_text()
    virtual = soup.select_one("div.topcard-content.virtual-visit-content") is not None

    # ---- Reviews ----
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
        "review_count": 0,  # updated after inserting reviews
        "average_wait_time": average_wait_time,
        "experience_years": exp_years,
        "phone": phone,
        "email": email,
        "overview": overview,
        "locations": locations,
        "conditions_treated": conditions,
        "specialties": specialties_list,
        "licenses": licenses,
        "education": education,
        "languages": languages,
        "insurance": insurance,
        "accepting_new_patients": accepting,
        "virtual_visit": virtual,
        "next_available": None,
    }

    return result, reviews


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-pages", type=int, default=None,
                        help="Stop after this many listing pages (for testing)")
    parser.add_argument("--specialty", type=str, default="psychiatry",
                        help="WebMD specialty slug (e.g. psychiatry, psychology, child-and-adolescent-psychiatry)")
    args = parser.parse_args()

    state_url = f"{BASE}/providers/specialty/{args.specialty}/illinois"

    db.init_db()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler("scraper.log"),
            logging.StreamHandler(),
        ],
    )
    global log
    log = logging.getLogger(__name__)
    log.info("Starting scrape for %s providers in Illinois", args.specialty)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ))

        profile_urls = collect_all_profile_urls(page, state_url, max_pages=args.max_pages)

        saved = 0
        skipped = 0
        total_reviews = 0

        for i, url in enumerate(profile_urls, 1):
            if db.provider_exists(url):
                log.info("[%d/%d] Already in DB — skipping: %s", i, len(profile_urls), url)
                skipped += 1
                continue
            log.info("[%d/%d] %s", i, len(profile_urls), url)
            try:
                html = fetch(page, url)
                provider, reviews = parse_profile(html, url)
                if provider:
                    provider_id = db.insert_provider(provider)
                    for rv in reviews:
                        rv["provider_id"] = provider_id
                        db.insert_review(rv)
                    db.update_review_count(url, len(reviews))
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
