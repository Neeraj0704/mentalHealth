"""
RateMDs scraper — scrapes one or more provider profile pages.
Returns structured data. No DB writes.
"""

import re
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

DATE_PATTERN = re.compile(r"^[A-Z][a-z]+ \d{1,2}, \d{4}$")

CREDENTIAL_SUFFIXES = re.compile(
    r",?\s*(MD|DO|PhD|PsyD|LCSW|LMFT|LPC|LMHC|DNP|PMHNP-BC|PMHNP|NP|MSW|"
    r"APRN|RN|MS|MA|LCPC|CADC|MFT|EdD|BCBA|MBA|MPH|DDS|DMD|DC|DVM)(\s*,.*)?$",
    re.IGNORECASE,
)


def strip_credentials(name: str) -> str:
    return CREDENTIAL_SUFFIXES.sub("", name).strip()


def scrape_ratemds(url: str) -> dict:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    # Doctor name
    name_tag = soup.find("h3", class_="provider-name")
    raw_name = name_tag.get_text(strip=True) if name_tag else ""
    name = re.sub(r"^Ratings\s*for\s*", "", raw_name).strip()

    # Overall rating
    overall_tag = soup.find("span", class_="rating-average")
    overall_rating = float(overall_tag.get_text(strip=True)) if overall_tag else None

    # Location from URL slug
    location = ""
    loc_match = re.search(r"-([A-Za-z]+)-([A-Z]{2})\.html", url)
    if loc_match:
        location = f"{loc_match.group(1)}, {loc_match.group(2)}"

    # Reviews — each in div.rating
    review_blocks = soup.find_all("div", class_="rating")
    raw_reviews = []

    for block in review_blocks:
        star_div = block.find("div", class_="star-rating")
        rating = float(star_div["title"]) if star_div and star_div.get("title") else None

        body_tag = block.find("p", class_="reviewBody")
        review_text = body_tag.get_text(strip=True) if body_tag else ""
        if not review_text:
            continue

        review_date = None
        for txt in block.stripped_strings:
            if DATE_PATTERN.match(txt.strip()):
                review_date = txt.strip()
                break

        raw_reviews.append({
            "rating": rating,
            "review_text": review_text,
            "review_date": review_date,
        })

    # Deduplicate by normalized text
    seen = set()
    reviews = []
    for r in raw_reviews:
        key = r["review_text"].lower().strip()
        if key not in seen:
            seen.add(key)
            reviews.append(r)

    return {
        "url": url,
        "name": name,
        "name_clean": strip_credentials(name),
        "location": location,
        "overall_rating": overall_rating,
        "reviews": reviews,
    }


def scrape_many(urls: list[str]) -> list[dict]:
    results = []
    for url in urls:
        try:
            data = scrape_ratemds(url)
            print(f"  scraped: {data['name']} — {len(data['reviews'])} reviews")
            results.append(data)
        except Exception as e:
            print(f"  ERROR scraping {url}: {e}")
    return results
