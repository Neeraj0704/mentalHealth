GAD7 = {
    "id": "GAD7",
    "condition": "Anxiety",
    "questions": [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid, as if something awful might happen",
    ],
    "answer_labels": [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day",
    ],
    "answer_values": [0, 1, 2, 3],
}

# Stubs — flesh out in future sprints
PHQ9 = {
    "id": "PHQ9",
    "condition": "Depression",
    "questions": [],
    "answer_labels": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    "answer_values": [0, 1, 2, 3],
}

INSTRUMENTS = {
    "GAD7": GAD7,
    "PHQ9": PHQ9,
}

# Keywords that map to an instrument
CONDITION_KEYWORDS = {
    "GAD7": ["anxiety", "anxious", "worried", "worry", "nervous", "panic", "stress", "tense", "on edge"],
    "PHQ9": ["depression", "depressed", "sad", "hopeless", "low mood", "unmotivated"],
}
