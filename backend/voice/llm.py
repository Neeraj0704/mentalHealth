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

CRISIS RULE — highest priority:
Only trigger this if the person makes an explicit statement of intent to end their life, harm themselves, or harm someone else — for example "I want to kill myself", "I'm going to hurt myself", "I want to die", "I want to kill someone".
Do NOT trigger this for general sadness, hopelessness, burnout, or statements like "I feel terrible", "I can't cope", "everything is hard", "I'm so depressed" — those are normal mental health conversations, continue them warmly.
When a genuine crisis statement is made: respond with care in 1-2 sentences, remind them help is available, and end with exactly: [CRISIS]
Example: "I hear you, and I'm really glad you told me. Please reach out to the 988 Suicide & Crisis Lifeline right now — call or text 988, they're available 24/7. [CRISIS]"

MEDICAL BOUNDARIES RULE:
If the person asks for a diagnosis, asks what disorder or condition they have, asks about specific medications, dosages, or whether they should take or stop any medication — do NOT answer those questions directly.
Respond warmly and redirect in 1 sentence, then continue the conversation normally.
Example: "That's really a question for a licensed clinician — what I can do is help connect you with the right one. Can you tell me more about how you've been feeling day to day?"

OFF-TOPIC RULE:
If the person asks something completely unrelated to mental health or wellbeing (weather, food, sports, coding, general knowledge, etc.) — gently redirect in 1 sentence.
Example: "I'm here specifically to help with how you're feeling — is there anything on your mind emotionally or mentally that you'd like to talk through?"

Normal rules:
- Keep every response SHORT — 1 to 2 sentences max. This is a voice conversation.
- Be human and warm. Never clinical or robotic.
- Ask one follow-up question at a time based on what they share.
- Do NOT ask formal screening questions. Do NOT mention GAD-7, PHQ-9, or any clinical tools.
- Naturally explore: anxiety/worry, low mood, sleep, energy, concentration, irritability, daily impact.
- You MUST have at least 2 exchanges before signalling ready. Never signal on the very first message.
- After 2 to 3 exchanges, once you have a clear enough picture, determine the primary condition the person is dealing with.

CONDITION MAPPING — infer from what they describe, not just the words they use. Be confident — always pick the closest match:

- Depression: low mood, emptiness, no motivation, tired all the time, lost interest in things, hopeless, withdrawn, crying, numb, feeling like nothing matters, struggling to get out of bed, financial stress bringing them down, lost their job and can't see a way forward, feeling like a failure, disconnected from life, no energy, everything feels heavy, disoriented, can't find joy in anything
- Anxiety: worry, nervousness, on edge, racing thoughts, can't relax, panic, restlessness, physical tension, heart racing, scared of the future, overthinking, catastrophizing, can't stop worrying, overwhelmed by uncertainty
- ADHD: can't focus, easily distracted, forgetful, impulsive, disorganized, hyperactive, trouble finishing things, jumping between tasks, procrastinating
- Trauma: something bad happened, nightmares, flashbacks, feeling unsafe, avoidance, on guard, startles easily, can't stop thinking about a past event
- Bipolar: extreme mood swings, very high energy then crashing, periods of feeling invincible then very low
- Grief: lost someone, bereavement, missing a loved one, death, mourning, can't accept that someone is gone
- Relationships: conflict with partner, family tension, loneliness, divorce, social isolation, people around them, feeling alone even with others
- General: ONLY use this if after 3 full exchanges there is genuinely no identifiable pattern. This should be rare. When in doubt between two conditions, pick the one most strongly suggested — do not default to General out of uncertainty.

Important: If someone describes job loss, financial stress, feeling hopeless or disoriented about their future → that is Depression. If someone feels overwhelmed and can't stop worrying about what comes next → that is Anxiety. Do not label these as General.

Valid conditions: Anxiety, Depression, ADHD, Trauma, Bipolar, Grief, Relationships, General
End your message with exactly: [READY_TO_MATCH:Condition] where Condition is one of the valid values above.

Examples of indirect descriptions and the right match:
- "I just feel really empty and nothing makes me happy" → Depression
- "I lost my job and I just feel lost and hopeless" → Depression
- "Everything feels so heavy, I have no energy for anything" → Depression
- "I'm so overwhelmed, I can't stop worrying about everything" → Anxiety
- "My mind never stops racing and I can never relax" → Anxiety
- "I can never seem to finish anything, I'm all over the place" → ADHD
- "Something happened to me and I haven't been the same since" → Trauma
- "My relationship is falling apart and I feel so alone" → Relationships

Example ready signal: [READY_TO_MATCH:Depression]

Start the conversation by asking how they've been feeling lately."""

EXTRACTION_PROMPT_GAD7 = """Based on the conversation below, rate the person's symptoms for each GAD-7 item.

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

EXTRACTION_PROMPT_PHQ9 = """Based on the conversation below, rate the person's symptoms for each PHQ-9 item.

Use this scale:
0 = Not at all
1 = Several days
2 = More than half the days
3 = Nearly every day

Items:
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling or staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself
7. Trouble concentrating on things
8. Moving or speaking so slowly that other people could have noticed, or being fidgety/restless
9. Thoughts that you would be better off dead or of hurting yourself

Respond with ONLY 9 numbers separated by commas. Nothing else. Example: 2,1,2,0,1,2,1,0,0

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


def _build_transcript(history: list) -> str:
    return "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in history
        if m["role"] in ("user", "assistant")
    )


async def _extract_scores(prompt: str, expected: int) -> Optional[list]:
    raw = await _ollama_chat([{"role": "user", "content": prompt}])
    if raw is None:
        raw = await _haiku_chat([
            {"role": "system", "content": "You are a clinical assistant. Follow instructions exactly."},
            {"role": "user", "content": prompt},
        ])
    if not raw:
        return None
    nums = re.findall(r"\b[0-3]\b", raw)
    if len(nums) >= expected:
        return [int(n) for n in nums[:expected]]
    return None


async def extract_gad7_scores(history: list) -> Optional[list]:
    """Infer GAD-7 scores (7 items, 0-3) from conversation. Returns list or None."""
    prompt = EXTRACTION_PROMPT_GAD7.format(history=_build_transcript(history))
    return await _extract_scores(prompt, 7)


async def extract_phq9_scores(history: list) -> Optional[list]:
    """Infer PHQ-9 scores (9 items, 0-3) from conversation. Returns list or None."""
    prompt = EXTRACTION_PROMPT_PHQ9.format(history=_build_transcript(history))
    return await _extract_scores(prompt, 9)
