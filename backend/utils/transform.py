import json
import re
from typing import Optional

CREDENTIAL_SUFFIXES = [
    "MD", "DO", "PhD", "PsyD", "LCSW", "LMFT", "LPC", "LMHC",
    "DNP", "PMHNP-BC", "PMHNP", "NP", "MSW", "APRN", "RN", "MS", "MA",
    "LCPC", "CADC", "MFT", "EdD", "QEEGD", "BCBA", "MBA", "MPH",
]


def parse_json_field(value, fallback=None):
    if fallback is None:
        fallback = []
    if not value:
        return fallback
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return fallback


def split_name_credentials(full_name: str):
    if not full_name:
        return "", ""
    parts = full_name.rsplit(",", 1)
    if len(parts) == 2:
        creds = parts[1].strip()
        if any(s in creds for s in CREDENTIAL_SUFFIXES) or len(creds) < 25:
            return parts[0].strip(), creds
    return full_name.strip(), ""


def parse_education(raw_list: list) -> list:
    result = []
    for entry in raw_list:
        if not entry:
            continue
        year_match = re.search(r"\b(19|20)\d{2}\b", entry)
        year = int(year_match.group()) if year_match else None
        text = re.sub(r"\bGraduated\s+\d{4}\b", "", entry).strip(" -,")
        parts = text.split(" - ", 1)
        if len(parts) == 2:
            school, degree = parts[0].strip(), parts[1].strip()
        else:
            school, degree = parts[0].strip(), ""
        result.append({"degree": degree, "school": school, "year": year})
    return result


def db_row_to_provider(row: dict, reviews: list = None) -> dict:
    locations = parse_json_field(row.get("locations"))
    first_loc = locations[0] if locations else {}

    name, credentials = split_name_credentials(row.get("name") or "")
    education_raw = parse_json_field(row.get("education"))

    return {
        "id": str(row["id"]),
        "name": name,
        "credentials": credentials,
        "provider_type": row.get("specialty") or "Other Specialist",
        "image": row.get("photo") or "",
        "rating": float(row.get("rating") or 0.0),
        "rating_count": int(row.get("rating_count") or 0),
        "review_count": int(row.get("review_count") or 0),
        "years_experience": int(row.get("experience_years") or 0),
        "average_wait_time": row.get("average_wait_time"),
        "practice_name": first_loc.get("clinic_name") or "",
        "address": first_loc.get("street") or "",
        "city": first_loc.get("city") or "",
        "state": first_loc.get("state") or "",
        "zip_code": first_loc.get("zipcode") or "",
        "phone": row.get("phone") or "",
        "email": row.get("email"),
        "specialties": parse_json_field(row.get("specialties")),
        "expertise": [],
        "conditions_treated": parse_json_field(row.get("conditions_treated")),
        "insurance_accepted": parse_json_field(row.get("insurance")),
        "languages": parse_json_field(row.get("languages")),
        "licenses": parse_json_field(row.get("licenses")),
        "gender": "Prefer not to say",
        "telehealth_available": bool(row.get("virtual_visit")),
        "in_person_available": len(locations) > 0,
        "accepting_new_patients": bool(row.get("accepting_new_patients")),
        "overview": row.get("overview") or "",
        "treatment_approaches": [],
        "education": parse_education(education_raw),
        "reviews": reviews or [],
        "verified": int(row.get("rating_count") or 0) > 0,
        "next_available": row.get("next_available"),
        "session_rate": None,
        "featured": False,
        "profile_url": row.get("profile_url"),
        "locations": locations,
        "profile_summary": row.get("profile_summary") or "",
        "pros": parse_json_field(row.get("pros")),
        "cons": parse_json_field(row.get("cons")),
        "sentiment_score": float(row.get("sentiment_score") or 0.5),
    }


def db_row_to_review(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "author": row.get("reviewer_name") or "Anonymous",
        "rating": float(row.get("rating") or 0.0),
        "date": row.get("review_date") or "",
        "content": row.get("review_text") or "",
        "helpful_count": None,
    }
