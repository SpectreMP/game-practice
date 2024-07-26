from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"

class UserOut(UserBase):
    id: int
    disabled: bool
    vk_id: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class FolderCreate(BaseModel):
    name: str
    parent: Optional[int] = None

class FolderSchema(BaseModel):
    id: int
    name: str
    parent: Optional[int] = None

    class Config:
        from_attributes = True

class FileSchema(BaseModel):
    id: int
    name: str
    url: str
    size: int
    folder: Optional[int] = None
    thumbnail: str

    class Config:
        from_attributes = True