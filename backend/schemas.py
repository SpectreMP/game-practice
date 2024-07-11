from pydantic import BaseModel, EmailStr
from typing import Optional, List

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

class FolderInfo(BaseModel):
    name: str
    path: str

class FileInfo(BaseModel):
    name: str
    path: str
    size: int

class FolderContents(BaseModel):
    folders: List[FolderInfo]
    files: List[FileInfo]