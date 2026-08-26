from pydantic import BaseModel
from app.models.user import UserRole
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: UserRole

class UserResponse(UserBase):
    id: int
    role: UserRole
    assigned_by: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
