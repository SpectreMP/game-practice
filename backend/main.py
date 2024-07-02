from datetime import timedelta  
from typing import Annotated, List
import httpx
from fastapi import Depends, FastAPI, HTTPException, status, Form, Request
from fastapi.security import OAuth2PasswordRequestForm  
from auth import (
    create_token, authenticate_user, RoleChecker, get_current_active_user, 
    validate_refresh_token, get_password_hash
)
from data import fake_users_db, refresh_tokens  
from models import User, Token, UserCreate, UserInDB
import os
from dotenv import load_dotenv

load_dotenv()

# app = FastAPI(root_path="/api/")  
app = FastAPI()  
  
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv('REFRESH_TOKEN_EXPIRE_MINUTES')) 
VK_CLIENT_ID = os.getenv('VK_CLIENT_ID')
VK_CLIENT_SECRET = os.getenv('VK_CLIENT_SECRET')
VK_REDIRECT_URI = os.getenv('VK_REDIRECT_URI')

@app.get("/hello")  
def hello_func():  
    return "Hello World"  

@app.get("/data")  
def get_data(_: Annotated[bool, Depends(RoleChecker(allowed_roles=["admin"]))]):  
    return {"data": "This is important data"}

@app.post("/token")  
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:  
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)  
    if not user:  
        raise HTTPException(status_code=400, detail="Incorrect username or password")  
      
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  
    refresh_token_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)  
      
    access_token = create_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)  
    refresh_token = create_token(data={"sub": user.username, "role": user.role}, expires_delta=refresh_token_expires)  
    refresh_tokens.append(refresh_token)  
    return Token(access_token=access_token, refresh_token=refresh_token)  
  
@app.post("/refresh")  
async def refresh_access_token(token_data: Annotated[tuple[User, str], Depends(validate_refresh_token)]):  
    user, token = token_data  
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  
    refresh_token_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)  
    access_token = create_token(data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires)  
    refresh_token = create_token(data={"sub": user.username, "role": user.role}, expires_delta=refresh_token_expires)  
  
    refresh_tokens.remove(token)  
    refresh_tokens.append(refresh_token)  
    return Token(access_token=access_token, refresh_token=refresh_token)

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(password)
    new_user = UserInDB(
        username=username,
        email=email,
        role="user",
        hashed_password=hashed_password,
        disabled=False
    )
    fake_users_db[username] = new_user.dict()
    return {"message": "User created successfully"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user

@app.get("/users", response_model=List[UserInDB])
async def get_all_users(_: Annotated[bool, Depends(RoleChecker(allowed_roles=["admin"]))]):
    return list(fake_users_db.values())

@app.get("/login/vk")
async def login_vk():
    return {"url": f"https://oauth.vk.com/authorize?client_id={VK_CLIENT_ID}&display=page&redirect_uri={VK_REDIRECT_URI}&scope=email&response_type=code&v=5.131"}

@app.get("/vk-callback")
async def vk_callback(code: str, request: Request):
    async with httpx.AsyncClient() as client:
        token_response = await client.get(f"https://oauth.vk.com/access_token?client_id={VK_CLIENT_ID}&client_secret={VK_CLIENT_SECRET}&redirect_uri={VK_REDIRECT_URI}&code={code}")
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        vk_access_token = token_data["access_token"]
        vk_user_id = token_data["user_id"]
        email = token_data.get("email")  # 
        
        user_response = await client.get(f"https://api.vk.com/method/users.get?user_ids={vk_user_id}&fields=first_name,last_name&access_token={vk_access_token}&v=5.131")
        user_data = user_response.json()["response"][0]
        
        # Создаем или обновляем пользователя в базе данных
        username = f"vk_{vk_user_id}"
        if username not in fake_users_db:
            fake_users_db[username] = {
                "username": username,
                "email": email or f"{username}@example.com",
                "role": "user",
                "hashed_password": "",  # Пустой пароль, так как аутентификация через VK
                "disabled": False,
                "vk_id": vk_user_id
            }
        
        # Создаем токены
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
        
        access_token = create_token(data={"sub": username, "role": "user"}, expires_delta=access_token_expires)
        refresh_token = create_token(data={"sub": username, "role": "user"}, expires_delta=refresh_token_expires)
        refresh_tokens.append(refresh_token)
        
        return Token(access_token=access_token, refresh_token=refresh_token)