from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"
    disabled: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    hashed_password: str = ""
    vk_id: str | None = None

class UserInDB(User):
    pass

class Token(BaseModel):  
    access_token: str
    refresh_token: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None
    
class FolderInfo(BaseModel):
    name: str
    path: str

class FileInfo(BaseModel):
    name: str
    path: str
    size: int

class FolderContents(BaseModel):
    folders: list[FolderInfo]
    files: list[FileInfo]