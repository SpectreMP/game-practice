from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    disabled: bool
    vk_id: Optional[str] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    refresh_token: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FileInfo(BaseModel):
    id: int
    filename: str
    is_folder: bool
    created_at: datetime
    updated_at: datetime

class FolderContents(BaseModel):
    items: List[FileInfo]