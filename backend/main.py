from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from auth import create_access_token, create_refresh_token, get_current_active_user, RoleChecker
from crud import (
    authenticate_user, create_user, get_user_by_username, get_users,
    create_refresh_token as create_db_refresh_token,
    delete_refresh_token, update_user_vk_id
)
from database import get_db
from file_operations import create_folder, delete_folder, get_folder_contents, upload_file, delete_file, rename_folder, download_file
from models import User
from schemas import Token, UserCreate, UserOut, FolderContents
from vk_auth import vk_login, vk_callback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from database import create_tables
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    create_tables()
    yield
    # Shutdown logic 
    
app = FastAPI(root_path="/api", lifespan=lifespan)

origins = ["http://localhost:3000",]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app = FastAPI(lifespan=lifespan)
    
@app.get("/hello")
def hello_func():
    return "Hello World"

@app.get("/data")
def get_data(_: bool = Depends(RoleChecker(allowed_roles=["admin"]))):
    return {"data": "This is important data"}

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username, "role": user.role})
    
    create_db_refresh_token(db, user.id, refresh_token)
    
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@app.post("/refresh", response_model=Token)
async def refresh_access_token(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    access_token = create_access_token(data={"sub": current_user.username, "role": current_user.role})
    refresh_token = create_refresh_token(data={"sub": current_user.username, "role": current_user.role})

    delete_refresh_token(db, current_user.id)
    create_db_refresh_token(db, current_user.id, refresh_token)
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users", response_model=List[UserOut])
async def read_users(
    db: Session = Depends(get_db),
    _: bool = Depends(RoleChecker(allowed_roles=["admin"]))
):
    return get_users(db)

@app.get("/login/vk")
async def login_vk_route():
    return vk_login()

@app.get("/vk-callback")
async def vk_callback_route(code: str, db: Session = Depends(get_db)):
    return await vk_callback(code, db)

@app.post("/folders/create")
async def create_folder_endpoint(
    folder_name: str,
    current_user: User = Depends(get_current_active_user)
):
    return create_folder(current_user.username, folder_name)

@app.delete("/folders/{folder_name}")
async def delete_folder_endpoint(
    folder_name: str,
    current_user: User = Depends(get_current_active_user)
):
    return delete_folder(current_user.username, folder_name)

@app.get("/folders", response_model=FolderContents)
async def list_folders(current_user: User = Depends(get_current_active_user)):
    return get_folder_contents(current_user.username)

@app.post("/upload")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    folder: str = Form(""),
    current_user: User = Depends(get_current_active_user)
):
    return upload_file(current_user.username, file, folder)

@app.delete("/files/{folder_name}/{file_name}")
async def delete_file_endpoint(
    folder_name: str,
    file_name: str,
    current_user: User = Depends(get_current_active_user)
):
    return delete_file(current_user.username, folder_name, file_name)

@app.put("/folders/{old_folder_name}")
async def edit_folder_endpoint(
    old_folder_name: str,
    new_folder_name: str,
    current_user: User = Depends(get_current_active_user)
):
    return rename_folder(current_user.username, old_folder_name, new_folder_name)

@app.get("/folders/{folder_name}/{file_name}/download", response_class=FileResponse)
async def download_file_endpoint(
    folder_name: str,
    file_name: str,
):
    return download_file(folder_name, file_name)