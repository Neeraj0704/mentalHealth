"""
LLM utilities — Ollama primary, Claude Haiku fallback.
Used only for conversation and score extraction. Never for deterministic scoring.
"""

import os
import re
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE  = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "15"))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# ── System prompt ─────────────────────────────────────────────────────────────
# The assistant has a warm, natural conversation and covers mental-health
# relevant topics organically. When it has enough to make a match, it
# appends [READY_TO_MATCH] — that tag is stripped before speaking.

SYSTEM_PROMPT = """You are a warm, empathetic mental health intake assistant for MindPath, an app that connects people with therapists and psychiatrists.

Your job: have a genuine, supportive conversation to understand how the person has been feeling. Then help match them with the right provider.

Rules:
- Keep every response SHORT — 1 to 2 sentences max. This is a voice conversation.
- Be human and warm. Never clinical or robotic.
- Ask one follow-up question at a time based on what they share.
- Do NOT ask formal screening questions. Do NOT mention GAD-7, PHQ-9, or any clinical tools.
- Naturally explore: anxiety/worry, low mood, sleep, energy, concentration, irritability, daily impact.
- After 6 to 10 exchanges, once you have a clear picture, end your message with exactly: [READY_TO_MATCH]

Example of good tone:
User: "I've been feeling really on edge lately"
You: "I'm sorry to hear that. Has it been hard to wind down, even when nothing specific is going on?"

Start the conversation by asking how they've been feeling lately."""

EXTRACTION_PROMPT = """Based on the conversation below, rate the person's symptoms for each GAD-7 item.

Use this scale:
0 = Not at all
1 = Several days
2 = More than half the days
3 = Nearly every day

Items:
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless that it is hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen

Respond with ONLY 7 numbers separated by commas. Nothing else. Example: 2,1,2,0,1,2,1

Conversation:
{history}"""


# ── Ollama chat ───────────────────────────────────────────────────────────────

async def _ollama_chat(messages: list) -> Optional[str]:
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            resp = await client.post(
                f"{OLLAMA_BASE}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 120},
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"Ollama chat failed: {e}")
        return None


# ── Haiku fallback ────────────────────────────────────────────────────────────

async def _haiku_chat(messages: list) -> Optional[str]:
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.startswith("sk-ant-..."):
        return None
    try:
        # Anthropic API uses system separate from messages
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        history = [m for m in messages if m["role"] != "system"]
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 120,
                    "system": system,
                    "messages": history,
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"].strip()
    except Exception as e:
        logger.warning(f"Haiku fallback failed: {e}")
        return None


# ── Public functions ──────────────────────────────────────────────────────────

async def chat(messages: list) -> str:
    """
    Send conversation history (including system prompt) to Ollama.
    Falls back to Haiku if Ollama unavailable.
    Returns the assistant reply, or a safe fallback string.
    """
    result = await _ollama_chat(messages)
    if result is None:
        result = await _haiku_chat(messages)
    if result is None:
        return "I'm having a little trouble right now. Can you tell me more about how you've been feeling?"
    return result


async def extract_gad7_scores(history: list) -> Optional[list]:
    """
    Given conversation history, ask Ollama to infer GAD-7 scores.
    Returns list of 7 ints (0-3), or None on failure.
    """
    # Build a readable transcript
    transcript = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in history
        if m["role"] in ("user", "assistant")
    )
    prompt = EXTRACTION_PROMPT.format(history=transcript)

    raw = await _ollama_chat([{"role": "user", "content": prompt}])
    if raw is None:
        raw = await _haiku_chat([
            {"role": "system", "content": "You are a clinical assistant. Follow instructions exactly."},
            {"role": "user", "content": prompt},
        ])
    if not raw:
        return None

    nums = re.findall(r"\b[0-3]\b", raw)
    if len(nums) >= 7:
        return [int(n) for n in nums[:7]]
    return None
