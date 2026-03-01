from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    icon_type: str
    color: str
    title: str
    body: str
    toast_variant: str
    unread: bool
    dismissed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
