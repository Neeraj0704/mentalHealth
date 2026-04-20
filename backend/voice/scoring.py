from typing import Tuple, Optional


def score_gad7(answers: list) -> Tuple[int, str, str]:
    """Deterministic GAD-7 scoring. Returns (total, severity, spoken_message)."""
    total = sum(answers)
    if total >= 15:
        return total, "Severe", (
            f"Your score is {total} out of 21, which suggests severe anxiety. "
            "I strongly recommend speaking with a specialist. "
            "I've found some providers who can help."
        )
    elif total >= 10:
        return total, "Moderate", (
            f"Your score is {total} out of 21, which suggests moderate anxiety. "
            "This is very common and very treatable. "
            "I've matched you with some providers who specialize in anxiety."
        )
    elif total >= 5:
        return total, "Mild", (
            f"Your score is {total} out of 21, which suggests mild anxiety. "
            "Speaking with a provider early can make a real difference. "
            "I've found some options for you."
        )
    else:
        return total, "Minimal", (
            f"Your score is {total} out of 21, which suggests minimal anxiety symptoms. "
            "That's encouraging. A provider can still offer valuable support if you want it."
        )


def score_phq9(answers: list) -> Tuple[int, str, str]:
    """Deterministic PHQ-9 scoring. Returns (total, severity, spoken_message)."""
    total = sum(answers)
    if total >= 20:
        return total, "Severe", (
            f"Your score is {total} out of 27, which suggests severe depression. "
            "I strongly encourage you to reach out to a mental health professional soon. "
            "I've found some providers who can help."
        )
    elif total >= 15:
        return total, "Moderately Severe", (
            f"Your score is {total} out of 27, which suggests moderately severe depression. "
            "This is very treatable with the right support. "
            "I've matched you with some providers who specialize in depression."
        )
    elif total >= 10:
        return total, "Moderate", (
            f"Your score is {total} out of 27, which suggests moderate depression. "
            "Many people find that talking to a therapist makes a real difference. "
            "I've found some options for you."
        )
    elif total >= 5:
        return total, "Mild", (
            f"Your score is {total} out of 27, which suggests mild depression. "
            "Connecting with a provider early can help. "
            "I've found some specialists who may be a good fit."
        )
    else:
        return total, "Minimal", (
            f"Your score is {total} out of 27, which suggests minimal depressive symptoms. "
            "That's a good sign. A provider can still offer support if you'd like it."
        )


_GENERIC_MESSAGES = {
    "ADHD":          "It sounds like focus and attention have been challenging for you. I've found some specialists who work with ADHD who could be a great fit.",
    "Trauma":        "Thank you for sharing that with me — it takes courage. I've matched you with trauma-informed therapists who can offer the right support.",
    "Bipolar":       "Navigating mood changes can be really hard. I've found some providers who specialize in mood disorders and can offer the right care.",
    "Grief":         "Grief is one of the hardest things we go through. I've matched you with therapists who specialize in loss and can walk alongside you.",
    "Relationships": "Relationship challenges can affect every part of life. I've found some therapists who specialize in this area and can help.",
    "General":       "It sounds like you're going through a lot. I've found some providers who can offer support across a range of concerns.",
}


def score_generic(condition: str) -> Tuple[Optional[int], Optional[str], str]:
    """For conditions without a formal instrument. Returns (None, None, spoken_message)."""
    message = _GENERIC_MESSAGES.get(condition, _GENERIC_MESSAGES["General"])
    return None, None, message


def score_instrument(instrument_id: str, answers: list) -> Tuple[int, str, str]:
    """Route to the correct scoring function by instrument ID."""
    if instrument_id == "GAD7":
        return score_gad7(answers)
    if instrument_id == "PHQ9":
        return score_phq9(answers)
    raise ValueError(f"Unknown instrument: {instrument_id}")
