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
import file_operations
from models import User
from schemas import Token, UserCreate, UserOut, FolderContents, FileInfo
from vk_auth import vk_login, vk_callback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from database import create_tables
from contextlib import asynccontextmanager
from typing import Optional


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

@app.post("/folders/create", response_model=FileInfo)
async def create_folder(
    folder_name: str,
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.create_folder(db, current_user, folder_name, parent_id)

@app.delete("/folders/delete/{folder_id}")
async def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.delete_folder(db, current_user, folder_id)

@app.get("/files", response_model=FolderContents)
async def list_files(
    folder_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    items = file_operations.get_folder_contents(db, current_user, folder_id)
    return FolderContents(items=items)

@app.post("/upload", response_model=FileInfo)
async def upload_file(
    file: UploadFile = File(...),
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.upload_file(db, current_user, file, parent_id)

@app.delete("/files/delete/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.delete_file(db, current_user, file_id)

@app.put("/folders/{old_folder_name}", response_model=FileInfo)
async def rename_file(
    file_id: int,
    new_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.rename_file(db, current_user, file_id, new_name)

@app.get("/folders/{folder_name}/{file_name}/download", response_class=FileResponse)
async def download_file_endpoint(
    folder_name: str,
    file_name: str,
):
    return file_operations.download_file(folder_name, file_name)