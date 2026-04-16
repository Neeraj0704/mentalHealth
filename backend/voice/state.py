from typing import TypedDict, Optional, List


class ConversationState(TypedDict):
    session_id: str
    phase: str              # "conversing" | "extracting" | "completed"
    messages: List[dict]    # full chat history [{"role": "user/assistant", "content": "..."}]
    turn_count: int         # how many exchanges so far
    # Populated after extraction
    instrument: Optional[str]
    gad7_answers: Optional[List[int]]
    score: Optional[int]
    severity: Optional[str]
    result_message: Optional[str]
    providers: Optional[List[dict]]
    # Per-turn output
    speech: str
    ui_options: Optional[List[str]]
