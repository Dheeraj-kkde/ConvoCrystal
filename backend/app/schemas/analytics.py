from pydantic import BaseModel


class StatItem(BaseModel):
    label: str
    value: str
    change: str


class StatsOut(BaseModel):
    total_documents: int
    uploaded: int
    exported: int
    ai_conversations: int
    stats: list[StatItem]


class ConfidenceRow(BaseModel):
    transcript: str
    overall: int
    faithfulness: int
    relevance: int
    precision: int
    date: str   # relative time


class ConfidenceOverviewOut(BaseModel):
    average: int
    rows: list[ConfidenceRow]


class ActivityItem(BaseModel):
    action: str
    target: str
    format: str | None = None
    time: str   # relative time


class SpeakerItem(BaseModel):
    name: str
    sessions: int
    initials: str
    color: str


class ChatSummaryItem(BaseModel):
    id: str
    title: str
    preview: str
    time: str
    starred: bool
    confidence: int
    subScores: dict  # {faithfulness, relevance, precision}
    speakers: int
