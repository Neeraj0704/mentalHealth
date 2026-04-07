def build_prompt(overview: str, reviews: list[dict]) -> str:
    overview = (overview or "")[:600].strip()

    review_lines = ""
    for i, r in enumerate(reviews[:15], 1):
        text = (r.get("review_text") or "")[:300].strip()
        rating = r.get("rating", "?")
        review_lines += f"{i}. [{rating}/5] {text}\n"

    no_review_note = ""
    if not reviews:
        no_review_note = "No patient reviews are available."
    elif len(reviews) < 3:
        no_review_note = f"Only {len(reviews)} review(s) available — keep review_summary brief."

    return f"""
You are summarizing a mental health provider profile for patients.

IMPORTANT:
- Use BOTH overview and reviews — do not rely only on reviews
- Do NOT reuse phrases or sentence structures from the input
- Rewrite everything in completely original wording
- Do NOT hallucinate facts not present in the input

PROVIDER OVERVIEW:
{overview or "No overview available."}

PATIENT REVIEWS:
{review_lines.strip() or "None."}
{no_review_note}

OUTPUT RULES:
- Respond ONLY with valid JSON
- profile_summary: 2-3 sentences (provider style + approach)
- review_summary: 2-3 sentences summarizing patient feedback
- pros:
    - Only include if explicitly supported by overview or reviews
    - If not clearly supported, return []
    - Do NOT infer personality traits (e.g., compassionate, caring) unless directly stated in the input
    - Max 5 words each
- cons: 0-3 short specific phrases (max 5 words each, only if clearly supported by input)
- sentiment_score:
    0.0-0.3 = mostly negative
    0.4-0.6 = mixed or limited reviews
    0.7-1.0 = mostly positive

IF NO REVIEWS:
- review_summary = "No patient reviews available."
- pros = []
- cons = []
- sentiment_score = 0.5

JSON SCHEMA:
{{
  "profile_summary": "string",
  "review_summary": "string",
  "pros": ["string"],
  "cons": ["string"],
  "sentiment_score": float
}}
"""
