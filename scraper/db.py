import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "webmd.db")


def get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            profile_url TEXT UNIQUE,
            photo TEXT,
            specialty TEXT,
            rating REAL,
            rating_count INTEGER,
            review_count INTEGER,
            average_wait_time TEXT,
            experience_years INTEGER,
            phone TEXT,
            email TEXT,
            overview TEXT,
            locations TEXT,
            conditions_treated TEXT,
            specialties TEXT,
            licenses TEXT,
            education TEXT,
            languages TEXT,
            insurance TEXT,
            accepting_new_patients INTEGER,
            virtual_visit INTEGER,
            next_available TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id INTEGER,
            provider_profile_url TEXT,
            rating REAL,
            review_text TEXT,
            review_date TEXT,
            reviewer_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def provider_exists(profile_url: str) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT 1 FROM providers WHERE profile_url = ?", (profile_url,))
    exists = c.fetchone() is not None
    conn.close()
    return exists


def insert_provider(data: dict):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO providers (
            name, profile_url, photo, specialty, rating, rating_count,
            review_count, average_wait_time, experience_years, phone, email,
            overview, locations, conditions_treated, specialties, licenses,
            education, languages, insurance,
            accepting_new_patients, virtual_visit, next_available
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        data.get("name"),
        data.get("profile_url"),
        data.get("photo"),
        data.get("specialty"),
        data.get("rating"),
        data.get("rating_count"),
        data.get("review_count"),
        data.get("average_wait_time"),
        data.get("experience_years"),
        data.get("phone"),
        data.get("email"),
        data.get("overview"),
        json.dumps(data.get("locations", [])),
        json.dumps(data.get("conditions_treated", [])),
        json.dumps(data.get("specialties", [])),
        json.dumps(data.get("licenses", [])),
        json.dumps(data.get("education", [])),
        json.dumps(data.get("languages", [])),
        json.dumps(data.get("insurance", [])),
        1 if data.get("accepting_new_patients") else 0,
        1 if data.get("virtual_visit") else 0,
        data.get("next_available"),
    ))
    provider_id = c.lastrowid
    conn.commit()
    conn.close()
    return provider_id


def update_review_count(profile_url: str, count: int):
    conn = get_conn()
    conn.execute(
        "UPDATE providers SET review_count = ? WHERE profile_url = ?",
        (count, profile_url)
    )
    conn.commit()
    conn.close()


def insert_review(data: dict):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO reviews (
            provider_id, provider_profile_url, rating, review_text, review_date, reviewer_name
        ) VALUES (?,?,?,?,?,?)
    """, (
        data.get("provider_id"),
        data.get("provider_profile_url"),
        data.get("rating"),
        data.get("review_text"),
        data.get("review_date"),
        data.get("reviewer_name"),
    ))
    conn.commit()
    conn.close()

