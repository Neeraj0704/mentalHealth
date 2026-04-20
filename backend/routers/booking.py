"""Appointment booking endpoint — stores requests in SQLite."""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_connection

router = APIRouter()
logger = logging.getLogger(__name__)


class BookingRequest(BaseModel):
    provider_id: str
    provider_name: str
    user_name: str
    user_email: str
    user_phone: Optional[str] = None
    preferred_time: str          # "Morning" | "Afternoon" | "Evening" | "Anytime"
    message: Optional[str] = None
    assessment_condition: Optional[str] = None
    assessment_severity: Optional[str] = None
    assessment_score: Optional[int] = None
    assessment_message: Optional[str] = None


def _ensure_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS booking_requests (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            provider_name TEXT NOT NULL,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            user_phone TEXT,
            preferred_time TEXT,
            message TEXT,
            assessment_condition TEXT,
            assessment_severity TEXT,
            assessment_score INTEGER,
            assessment_message TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()


@router.post("/bookings")
def create_booking(req: BookingRequest):
    try:
        conn = get_connection()
        _ensure_table(conn)
        booking_id = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO booking_requests
               (id, provider_id, provider_name, user_name, user_email, user_phone,
                preferred_time, message, assessment_condition, assessment_severity,
                assessment_score, assessment_message, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                booking_id, req.provider_id, req.provider_name,
                req.user_name, req.user_email, req.user_phone,
                req.preferred_time, req.message,
                req.assessment_condition, req.assessment_severity,
                req.assessment_score, req.assessment_message,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        logger.info(f"Booking {booking_id} created for provider {req.provider_id}")
        return {"success": True, "booking_id": booking_id}
    except Exception as e:
        logger.exception(f"Booking creation failed: {e}")
        return {"success": False, "error": str(e)}
