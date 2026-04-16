from typing import Optional

# Maps scale answer value (0-3) to recognized spoken phrases
SCALE_ALIASES: dict[int, list[str]] = {
    0: [
        "not at all", "never", "zero", "no", "nope", "not really",
        "none", "not once", "not even once", "barely", "not much",
    ],
    1: [
        "several days", "sometimes", "a few days", "a little", "some days",
        "few days", "couple of days", "couple days", "a couple", "once in a while",
        "occasionally", "now and then", "here and there", "few times",
    ],
    2: [
        "more than half", "most days", "usually", "frequently", "a lot",
        "most of the time", "half the days", "more often than not",
        "quite a bit", "quite often", "regularly", "pretty often",
    ],
    3: [
        "nearly every day", "every day", "always", "daily",
        "almost always", "constantly", "all the time", "almost every day",
        "every single day", "non stop", "nonstop", "every night",
    ],
}

YES_ALIASES = ["yes", "yeah", "yep", "yup", "correct", "true", "definitely", "absolutely", "sure"]
NO_ALIASES = ["no", "nope", "nah", "not really", "false", "negative", "don't think so"]


def map_scale_answer(transcript: str) -> Optional[int]:
    """
    Deterministic keyword match for 0-3 scale answers.
    Returns None if no confident match found.
    """
    t = transcript.lower().strip()

    # Try longest alias first so "nearly every day" beats "every"
    candidates = []
    for value, aliases in SCALE_ALIASES.items():
        for alias in aliases:
            if alias in t:
                candidates.append((len(alias), value))

    if candidates:
        # Pick the match with the longest matching phrase (most specific)
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return None


def map_yes_no(transcript: str) -> Optional[bool]:
    t = transcript.lower().strip()
    if any(a in t for a in YES_ALIASES):
        return True
    if any(a in t for a in NO_ALIASES):
        return False
    return None
