from typing import Tuple


def score_gad7(answers: list) -> Tuple[int, str, str]:
    """
    Deterministic GAD-7 scoring. Never calls an LLM.
    Returns (total_score, severity_label, spoken_result_message)
    """
    total = sum(answers)

    if total >= 15:
        severity = "Severe"
        message = (
            f"Your score is {total} out of 21, which suggests severe anxiety. "
            "I strongly recommend speaking with a specialist. "
            "I've found some providers who can help."
        )
    elif total >= 10:
        severity = "Moderate"
        message = (
            f"Your score is {total} out of 21, which suggests moderate anxiety. "
            "This is very common and very treatable. "
            "I've matched you with some providers who specialize in anxiety."
        )
    elif total >= 5:
        severity = "Mild"
        message = (
            f"Your score is {total} out of 21, which suggests mild anxiety. "
            "Speaking with a provider early can make a real difference. "
            "I've found some options for you."
        )
    else:
        severity = "Minimal"
        message = (
            f"Your score is {total} out of 21, which suggests minimal anxiety symptoms. "
            "That's encouraging. A provider can still offer valuable support if you want it."
        )

    return total, severity, message


def score_instrument(instrument_id: str, answers: list) -> Tuple[int, str, str]:
    """Route to the correct scoring function by instrument ID."""
    if instrument_id == "GAD7":
        return score_gad7(answers)
    raise ValueError(f"Unknown instrument: {instrument_id}")
