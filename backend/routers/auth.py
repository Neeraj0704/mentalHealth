from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

import sqlite3
import os

USER_DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'users.db')

def get_user_connection():
    conn = sqlite3.connect(USER_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

from database import get_connection

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "mindpath-secret-key-2025-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

bearer_scheme = HTTPBearer(auto_error=False)


# ── DB setup ──────────────────────────────────────────────────────────────────

def init_tables():
    conn = get_user_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            preferences TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS saved_providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider_id TEXT NOT NULL,
            saved_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, provider_id)
        );

        CREATE TABLE IF NOT EXISTS saved_facilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            facility_id INTEGER NOT NULL,
            saved_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, facility_id)
        );

        CREATE TABLE IF NOT EXISTS assessment_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            condition TEXT NOT NULL,
            severity TEXT,
            score INTEGER,
            instrument TEXT,
            summary TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()

init_tables()


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Optional[int]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except JWTError:
        return None

def require_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> int:
    user_id = get_user_id(credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


# ── Auth endpoints ─────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdatePreferencesRequest(BaseModel):
    preferences: dict

@router.post("/register")
def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    conn = get_user_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    conn.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (req.name.strip(), req.email.lower().strip(), hash_password(req.password))
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email.lower(),)).fetchone()
    conn.close()
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@router.post("/login")
def login(req: LoginRequest):
    conn = get_user_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),)).fetchone()
    conn.close()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    prefs = {}
    try:
        prefs = json.loads(user["preferences"] or "{}")
    except Exception:
        pass
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "preferences": prefs}}


@router.get("/me")
def me(user_id: int = Depends(require_user)):
    conn = get_user_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    prefs = {}
    try:
        prefs = json.loads(user["preferences"] or "{}")
    except Exception:
        pass
    return {"id": user["id"], "name": user["name"], "email": user["email"], "preferences": prefs}


@router.put("/preferences")
def update_preferences(req: UpdatePreferencesRequest, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    conn.execute("UPDATE users SET preferences = ? WHERE id = ?", (json.dumps(req.preferences), user_id))
    conn.commit()
    conn.close()
    return {"success": True}


# ── Saved providers ───────────────────────────────────────────────────────────

@router.get("/saved/providers")
def get_saved_providers(user_id: int = Depends(require_user)):
    user_conn = get_user_connection()
    saved = user_conn.execute(
        "SELECT provider_id FROM saved_providers WHERE user_id = ? ORDER BY saved_at DESC",
        (user_id,)
    ).fetchall()
    user_conn.close()
    if not saved:
        return {"providers": []}
    ids = [r["provider_id"] for r in saved]
    provider_conn = get_connection()
    placeholders = ','.join(['?' for _ in ids])
    rows = provider_conn.execute(
        f"SELECT p.*, pi.profile_summary, pi.pros, pi.cons, pi.sentiment_score FROM providers p LEFT JOIN provider_insights pi ON p.id = pi.provider_id WHERE p.id IN ({placeholders})",
        ids
    ).fetchall()
    provider_conn.close()
    from utils.transform import db_row_to_provider
    return {"providers": [db_row_to_provider(dict(r)) for r in rows]}


@router.post("/saved/providers/{provider_id}")
def save_provider(provider_id: str, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO saved_providers (user_id, provider_id) VALUES (?, ?)", (user_id, provider_id))
        conn.commit()
    finally:
        conn.close()
    return {"success": True}


@router.delete("/saved/providers/{provider_id}")
def unsave_provider(provider_id: str, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    conn.execute("DELETE FROM saved_providers WHERE user_id = ? AND provider_id = ?", (user_id, provider_id))
    conn.commit()
    conn.close()
    return {"success": True}


# ── Saved facilities ──────────────────────────────────────────────────────────

@router.get("/saved/facilities")
def get_saved_facilities(user_id: int = Depends(require_user)):
    user_conn = get_user_connection()
    saved = user_conn.execute(
        "SELECT facility_id FROM saved_facilities WHERE user_id = ? ORDER BY saved_at DESC",
        (user_id,)
    ).fetchall()
    user_conn.close()
    if not saved:
        return {"facilities": []}
    ids = [r["facility_id"] for r in saved]
    conn = get_connection()
    placeholders = ','.join(['?' for _ in ids])
    rows = conn.execute(f"SELECT * FROM facilities WHERE id IN ({placeholders})", ids).fetchall()
    conn.close()
    import json as _json
    def row_to_facility(row):
        r = dict(row)
        for field in ('languages', 'payment', 'services', 'types'):
            raw = r.get(field)
            if isinstance(raw, str):
                try:
                    r[field] = _json.loads(raw)
                except Exception:
                    r[field] = []
        r['telehealth'] = bool(r.get('telehealth'))
        return r
    return {"facilities": [row_to_facility(r) for r in rows]}


@router.post("/saved/facilities/{facility_id}")
def save_facility(facility_id: int, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO saved_facilities (user_id, facility_id) VALUES (?, ?)", (user_id, facility_id))
        conn.commit()
    finally:
        conn.close()
    return {"success": True}


@router.delete("/saved/facilities/{facility_id}")
def unsave_facility(facility_id: int, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    conn.execute("DELETE FROM saved_facilities WHERE user_id = ? AND facility_id = ?", (user_id, facility_id))
    conn.commit()
    conn.close()
    return {"success": True}


# ── Assessment history ────────────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    condition: str
    severity: Optional[str] = None
    score: Optional[int] = None
    instrument: Optional[str] = None
    summary: Optional[str] = None

@router.post("/assessments")
def save_assessment(req: AssessmentRequest, user_id: int = Depends(require_user)):
    conn = get_user_connection()
    conn.execute(
        "INSERT INTO assessment_history (user_id, condition, severity, score, instrument, summary) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, req.condition, req.severity, req.score, req.instrument, req.summary)
    )
    conn.commit()
    conn.close()
    return {"success": True}

@router.get("/assessments")
def get_assessments(user_id: int = Depends(require_user)):
    conn = get_user_connection()
    rows = conn.execute(
        "SELECT * FROM assessment_history WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return {"assessments": [dict(r) for r in rows]}
