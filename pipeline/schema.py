from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ProviderInsight(BaseModel):
    profile_summary: Optional[str] = None
    review_summary: Optional[str] = None
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    sentiment_score: float = Field(default=0.5, ge=0.0, le=1.0)

    @field_validator("pros", mode="before")
    @classmethod
    def cap_pros(cls, v):
        return (v or [])[:4]

    @field_validator("cons", mode="before")
    @classmethod
    def cap_cons(cls, v):
        return (v or [])[:3]
