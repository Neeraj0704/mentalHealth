"""
LangGraph conversational flow.

Each API turn:
  START → (route by phase) → one node → END

Phases:
  conversing  — Ollama drives a natural back-and-forth
  extracting  — Ollama infers GAD-7 scores from the conversation
  completed   — results ready
"""

import logging
from langgraph.graph import StateGraph, START, END

from .state import ConversationState
from .llm import SYSTEM_PROMPT, chat, extract_gad7_scores
from .scoring import score_gad7

logger = logging.getLogger(__name__)

READY_TAG = "[READY_TO_MATCH]"


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

    # Build history — system prompt is always first
    history = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Append stored history
    history.extend(messages)

    # Append this turn's user message
    # On the very first turn user_input is empty — send a neutral kick-starter
    history.append({"role": "user", "content": user_input or "Hi"})

    # Call Ollama
    reply = await chat(history)

    # Check for ready signal
    ready = READY_TAG in reply
    clean_reply = reply.replace(READY_TAG, "").strip()

    # Update stored messages
    updated_messages = list(messages)
    if user_input:
        updated_messages.append({"role": "user", "content": user_input})
    updated_messages.append({"role": "assistant", "content": clean_reply})

    return {
        "phase": "extracting" if ready else "conversing",
        "messages": updated_messages,
        "turn_count": state.get("turn_count", 0) + 1,
        "speech": clean_reply,
        "ui_options": None,
    }


# ── Node: extract ─────────────────────────────────────────────────────────────

async def extract_node(state: ConversationState) -> dict:
    messages = state.get("messages", [])

    answers = await extract_gad7_scores(messages)

    # Fallback if extraction fails: assume mild (1 per item)
    if not answers:
        logger.warning("Score extraction failed — defaulting to mild (1s)")
        answers = [1] * 7

    score, severity, message = score_gad7(answers)
    providers = _get_providers("Anxiety")

    provider_mention = ""
    if providers:
        names = [p["name"] for p in providers[:2]]
        provider_mention = f" I've found some specialists who can help, including {' and '.join(names)}."

    speech = (
        f"Based on our conversation, {message.lower()}"
        f"{provider_mention}"
        " You can see their full profiles in the app."
    )

    return {
        "phase": "completed",
        "instrument": "GAD7",
        "gad7_answers": answers,
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
    if phase == "completed":
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

# After converse: if phase flipped to "extracting", chain immediately to extract
def _after_converse(state: ConversationState) -> str:
    return "extract" if state.get("phase") == "extracting" else "__end__"

builder.add_conditional_edges(
    "converse",
    _after_converse,
    {"extract": "extract", "__end__": END},
)

builder.add_edge("extract", END)

assessment_graph = builder.compile()
