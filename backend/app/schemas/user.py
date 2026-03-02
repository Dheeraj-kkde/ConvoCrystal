from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    avatar: str | None = None
    workspace_name: str | None = None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_user(cls, user) -> "UserOut":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar_url,
            workspace_name=user.workspace_name,
            is_verified=user.is_verified,
            created_at=user.created_at,
        )


class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    workspace_name: str | None = None
