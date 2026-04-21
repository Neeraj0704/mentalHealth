"""
LangGraph conversational flow.

Each API turn:
  START → (route by phase) → one node → END

Phases:
  conversing  — Ollama drives a natural back-and-forth
  extracting  — Ollama infers scores from the conversation
  completed   — results ready
"""

import re
import logging
from langgraph.graph import StateGraph, START, END

from .state import ConversationState
from .llm import SYSTEM_PROMPT, chat, extract_gad7_scores, extract_phq9_scores
from .scoring import score_gad7, score_phq9, score_generic

logger = logging.getLogger(__name__)

READY_TAG_PATTERN = re.compile(r'\[READY_TO_MATCH(?::([^\]]+))?\]', re.IGNORECASE)

SCORED_CONDITIONS   = {"Anxiety", "Depression"}
GENERIC_CONDITIONS  = {"ADHD", "Trauma", "Bipolar", "Grief", "Relationships", "General"}
VALID_CONDITIONS    = SCORED_CONDITIONS | GENERIC_CONDITIONS


def _get_providers(condition: str) -> list:
    try:
        from database import get_connection
        from utils.transform import db_row_to_provider
        conn = get_connection()
        rows = conn.execute(
            "SELECT p.*, pi.profile_summary, pi.pros, pi.cons, pi.sentiment_score "
            "FROM providers p LEFT JOIN provider_insights pi ON p.id = pi.provider_id "
            "WHERE p.conditions_treated LIKE ? OR p.specialties LIKE ? "
            "ORDER BY p.rating DESC LIMIT 3",
            (f"%{condition}%", f"%{condition}%"),
        ).fetchall()
        conn.close()
        return [db_row_to_provider(dict(r)) for r in rows]
    except Exception as e:
        logger.warning(f"Provider lookup failed: {e}")
        return []


# ── Node: converse ────────────────────────────────────────────────────────────

async def converse_node(state: ConversationState) -> dict:
    messages = state.get("messages", [])
    user_input = state.get("user_input", "").strip()

    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    history.extend(messages)
    history.append({"role": "user", "content": user_input or "Hi"})

    reply = await chat(history)

    match = READY_TAG_PATTERN.search(reply)
    ready = bool(match)
    detected_condition = None
    if match:
        raw_cond = (match.group(1) or "").strip().title()
        detected_condition = raw_cond if raw_cond in VALID_CONDITIONS else "General"

    clean_reply = READY_TAG_PATTERN.sub("", reply).strip()

    updated_messages = list(messages)
    if user_input:
        updated_messages.append({"role": "user", "content": user_input})
    updated_messages.append({"role": "assistant", "content": clean_reply})

    return {
        "phase": "instrument" if ready else "conversing",
        "messages": updated_messages,
        "turn_count": state.get("turn_count", 0) + 1,
        "detected_condition": detected_condition,
        "speech": clean_reply,
        "ui_options": None,
    }


# ── Node: extract ─────────────────────────────────────────────────────────────

async def extract_node(state: ConversationState) -> dict:
    messages = state.get("messages", [])
    condition = state.get("detected_condition") or "Anxiety"

    score = None
    severity = None
    instrument = None

    if condition == "Anxiety":
        instrument = "GAD7"
        answers = await extract_gad7_scores(messages)
        if not answers:
            logger.warning("GAD-7 extraction failed — defaulting to mild (1s)")
            answers = [1] * 7
        score, severity, message = score_gad7(answers)

    elif condition == "Depression":
        instrument = "PHQ9"
        answers = await extract_phq9_scores(messages)
        if not answers:
            logger.warning("PHQ-9 extraction failed — defaulting to mild (1s)")
            answers = [1] * 9
        score, severity, message = score_phq9(answers)

    else:
        # No formal instrument for ADHD, Grief, Trauma, etc.
        instrument = None
        answers = None
        score, severity, message = score_generic(condition)

    providers = _get_providers(condition)

    speech = (
        f"Based on our conversation, {message.lower()}"
        " You can browse matched providers in the app."
    )

    return {
        "phase": "completed",
        "instrument": instrument,
        "gad7_answers": answers if instrument == "GAD7" else None,
        "score": score,
        "severity": severity,
        "result_message": message,
        "providers": providers,
        "speech": speech,
        "ui_options": None,
    }


# ── Routing ───────────────────────────────────────────────────────────────────

def _entry_router(state: ConversationState) -> str:
    phase = state.get("phase", "conversing")
    if phase == "extracting":
        return "extract"
    if phase in ("completed", "instrument"):
        return "__end__"
    return "converse"


# ── Graph compilation ─────────────────────────────────────────────────────────

builder = StateGraph(ConversationState)
builder.add_node("converse", converse_node)
builder.add_node("extract", extract_node)

builder.add_conditional_edges(
    START,
    _entry_router,
    {"converse": "converse", "extract": "extract", "__end__": END},
)

def _after_converse(state: ConversationState) -> str:
    return "__end__"

builder.add_conditional_edges(
    "converse",
    _after_converse,
    {"extract": "extract", "__end__": END},
)

builder.add_edge("extract", END)

assessment_graph = builder.compile()
