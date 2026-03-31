"""
Test scrape: fetch one doctor from WebMD psychiatry Illinois listing,
extract all fields per CLAUDE.md spec, store in webmd.db, and print JSON.
"""

import json
import re
import sys
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import db

BASE = "https://doctor.webmd.com"
LISTING_URL = f"{BASE}/providers/specialty/psychiatry/illinois/chicago"


def fetch(page, url):
    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    time.sleep(4)
    return page.content()


def get_first_profile_url(html):
    soup = BeautifulSoup(html, "lxml")
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if re.search(r"/doctor/.+-[a-f0-9\-]{36}-overview$", href):
            return href if href.startswith("http") else BASE + href
    return None


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
    review_count = agg.get("reviewCount")
    rating_count = review_count  # WebMD uses reviewCount for both

    # ---- Experience (parse from HTML body text) ----
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

    # ---- Overview ----
    overview = entity.get("description")

    # ---- Locations — IL only ----
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
            "office_hours": None,   # not in JSON-LD; would require HTML parsing per location
            "virtual_hours": None,
        })

    if not locations:
        print("No Illinois locations found — skipping.", file=sys.stderr)
        return None, []

    # ---- Medical Info ----
    conditions = entity.get("knowsAbout", [])

    specialties_list = [
        s.get("name") if isinstance(s, dict) else s
        for s in entity.get("medicalSpecialty", [])
    ]

    # ---- Education & Credentials ----
    cred = entity.get("hasCredential", {})
    if isinstance(cred, dict):
        education = cred.get("name", [])
        if isinstance(education, str):
            education = [education]
    else:
        education = []

    licenses = []
    certifications = []

    # ---- Additional Info ----
    languages = [
        l.get("name") if isinstance(l, dict) else l
        for l in entity.get("knowsLanguage", [])
    ]
    insurance = entity.get("healthPlanNetworkId", [])

    # ---- Availability ----
    accepting_text = body_text
    accepting = "Accepting New Patients" in accepting_text
    virtual = "Virtual Visit Available" in accepting_text

    next_avail = None

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
        "review_count": review_count,
        "average_wait_time": None,
        "experience_years": exp_years,
        "phone": phone,
        "email": email,
        "overview": overview,
        "locations": locations,
        "conditions_treated": conditions,
        "specialties": specialties_list,
        "licenses": licenses,
        "education": education,
        "certifications": certifications,
        "languages": languages,
        "insurance": insurance,
        "accepting_new_patients": accepting,
        "virtual_visit": virtual,
        "next_available": next_avail,
    }

    return result, reviews


def main():
    db.init_db()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ))

        print("Fetching listing page...")
        listing_html = fetch(page, LISTING_URL)
        profile_url = get_first_profile_url(listing_html)

        if not profile_url:
            print("Could not find a profile URL on listing page.", file=sys.stderr)
            sys.exit(1)

        print(f"Found profile: {profile_url}")
        profile_html = fetch(page, profile_url)
        browser.close()

    provider, reviews = parse_profile(profile_html, profile_url)

    if not provider:
        print("No valid provider data extracted.")
        sys.exit(1)

    db.insert_provider(provider)
    for rv in reviews:
        db.insert_review(rv)

    print("\n=== PROVIDER ===")
    print(json.dumps(provider, indent=2, default=str))
    print(f"\n=== REVIEWS ({len(reviews)}) ===")
    print(json.dumps(reviews, indent=2, default=str))
    print(f"\nStored in webmd.db — providers: 1, reviews: {len(reviews)}")


if __name__ == "__main__":
    main()
