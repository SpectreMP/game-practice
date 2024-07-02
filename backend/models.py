from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "user"
    disabled: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    hashed_password: str

class UserInDB(User):
    pass

class Token(BaseModel):  
    access_token: str
    refresh_token: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None