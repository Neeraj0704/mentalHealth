"""
Voice agent router.

Endpoints:
  POST /chat/completions   — ElevenLabs Custom LLM webhook (OpenAI-compatible, streaming)
  GET  /voice/state/{id}   — Mobile app polls for mindpath_ui after each voice turn
"""

import json
import uuid
import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

from .state import ConversationState
from .graph import assessment_graph
from .llm import chat

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory session store ────────────────────────────────────────────────────
SESSIONS: dict[str, ConversationState] = {}


def _new_session(session_id: str) -> ConversationState:
    return {
        "session_id": session_id,
        "phase": "conversing",
        "messages": [],
        "turn_count": 0,
        "detected_condition": None,
        "instrument": None,
        "gad7_answers": None,
        "score": None,
        "severity": None,
        "result_message": None,
        "providers": None,
        "speech": "",
        "ui_options": None,
        "user_input": "",
    }


def _get_session(conversation_id: str) -> ConversationState:
    if conversation_id not in SESSIONS:
        SESSIONS[conversation_id] = _new_session(conversation_id)
    return SESSIONS[conversation_id]


# ── mindpath_ui builder ────────────────────────────────────────────────────────

def _build_ui(state: ConversationState) -> dict:
    providers_out = None
    if state.get("providers"):
        providers_out = [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "provider_type": p.get("provider_type"),
                "rating": p.get("rating"),
                "city": p.get("city"),
                "state": p.get("state"),
                "telehealth_available": p.get("telehealth_available"),
                "accepting_new_patients": p.get("accepting_new_patients"),
                "image": p.get("image"),
            }
            for p in (state["providers"] or [])[:3]
        ]

    turn = state.get("turn_count", 0)
    # Rough progress estimate during conversation (caps at 0.85 until completed)
    progress = min(round(turn / 10, 2), 0.85) if state.get("phase") != "completed" else 1.0

    return {
        "phase": state.get("phase"),
        "turn_count": turn,
        "progress": progress,
        "score": state.get("score"),
        "severity": state.get("severity"),
        "condition": state.get("detected_condition"),
        "options": state.get("ui_options"),
        "providers": providers_out,
    }


# ── SSE streaming helpers ──────────────────────────────────────────────────────

async def _stream_chunks(response_id: str, speech: str, mindpath_ui: dict):
    """
    Stream speech text word-by-word in OpenAI SSE format.
    mindpath_ui is attached to the final chunk so clients can parse it.
    """
    words = speech.split()

    for i, word in enumerate(words):
        is_last = i == len(words) - 1
        chunk = {
            "id": response_id,
            "object": "chat.completion.chunk",
            "choices": [{
                "index": 0,
                "delta": {"content": word if is_last else word + " "},
                "finish_reason": None,
            }],
        }
        yield f"data: {json.dumps(chunk)}\n\n"
        # Yield control so FastAPI can flush immediately
        await asyncio.sleep(0)

    # Final chunk — finish_reason + mindpath_ui metadata
    final = {
        "id": response_id,
        "object": "chat.completion.chunk",
        "choices": [{
            "index": 0,
            "delta": {},
            "finish_reason": "stop",
        }],
        "mindpath_ui": mindpath_ui,
    }
    yield f"data: {json.dumps(final)}\n\n"
    yield "data: [DONE]\n\n"


# ── POST /chat/completions ─────────────────────────────────────────────────────

@router.post("/chat/completions")
async def chat_completions(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    # ElevenLabs sends conversation_id at root level
    conversation_id: str = (
        body.get("conversation_id")
        or body.get("metadata", {}).get("conversation_id")
        or "default-session"
    )

    # Extract the last user message
    messages: list = body.get("messages", [])
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_message = msg.get("content", "").strip()
            break

    logger.info(f"[{conversation_id}] user: {user_message!r}")

    # Load session state and inject this turn's user input
    state = _get_session(conversation_id)
    state = {**state, "user_input": user_message}

    # Run one LangGraph step
    try:
        result: AssessmentState = await assessment_graph.ainvoke(state)
    except Exception as e:
        logger.exception(f"Graph error for session {conversation_id}: {e}")
        result = {**state, "speech": "I'm sorry, something went wrong. Let's try again. What's been on your mind lately?"}

    # Persist updated state
    SESSIONS[conversation_id] = result

    speech: str = result.get("speech") or "I didn't understand. Could you say that again?"
    mindpath_ui = _build_ui(result)
    response_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"

    logger.info(f"[{conversation_id}] phase={result.get('phase')} speech={speech[:60]!r}")

    # ElevenLabs requires streaming
    if body.get("stream", True):
        return StreamingResponse(
            _stream_chunks(response_id, speech, mindpath_ui),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # Non-streaming fallback (useful for testing with curl)
    return JSONResponse({
        "id": response_id,
        "object": "chat.completion",
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": speech},
            "finish_reason": "stop",
        }],
        "mindpath_ui": mindpath_ui,
    })


# ── GET /voice/state/{session_id} ─────────────────────────────────────────────

@router.get("/voice/state/{session_id}")
async def get_voice_state(session_id: str):
    """
    Mobile app calls this after each ElevenLabs voice turn to get UI state.
    Returns the current mindpath_ui for the session.
    """
    state = SESSIONS.get(session_id)
    if not state:
        return JSONResponse({"error": "Session not found"}, status_code=404)

    return {
        "session_id": session_id,
        "mindpath_ui": _build_ui(state),
    }


# ── POST /voice/summary ───────────────────────────────────────────────────────

@router.post("/voice/summary")
async def generate_summary(request: Request):
    """
    Generate a short LLM summary of the full intake session.
    Body: { conversation: [{role, content}], qa_items: [{question, answer}], condition: str }
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    conversation: list = body.get("conversation", [])
    qa_items: list = body.get("qa_items", [])
    condition: str = body.get("condition", "")

    conv_text = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in conversation
        if m.get("role") in ("user", "assistant")
    )

    qa_text = ""
    if qa_items:
        qa_text = f"\nScreening responses ({condition}):\n" + "\n".join(
            f"- {item['question']}: {item['answer']}"
            for item in qa_items
        )

    prompt = (
        "Write a 2-3 sentence clinical summary of this mental health intake conversation. "
        "Write in third person (e.g. 'The individual reported...'). "
        "Capture their emotional state, main concerns, and what the screening revealed. "
        "Be warm, factual, and avoid jargon. Do not mention instrument names or numerical scores.\n\n"
        f"Conversation:\n{conv_text}{qa_text}\n\nSummary:"
    )

    summary = await chat([{"role": "user", "content": prompt}])
    return {"summary": summary}


# ── GET /voice/sessions (debug only) ─────────────────────────────────────────

@router.get("/voice/sessions")
async def list_sessions():
    """Debug endpoint — lists active sessions and their phase."""
    return {
        sid: {"phase": s.get("phase"), "question_index": s.get("question_index")}
        for sid, s in SESSIONS.items()
    }
