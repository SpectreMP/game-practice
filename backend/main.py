"""
The main FastAPI application file containing all endpoints.
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, create_tables
from models import User
from schemas import FileSchema, FolderSchema, FolderCreate, Token, UserCreate, UserOut
import file_operations
from auth import get_current_active_user, create_access_token, create_refresh_token, RoleChecker
import user_operations
from vk_auth import vk_callback, vk_login
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from config import THUMBNAIL_DIR, CORS_ORIGINS
from fastapi.responses import FileResponse

async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(root_path="/api", lifespan=lifespan)
app.mount("/thumbnails", StaticFiles(directory=THUMBNAIL_DIR), name="thumbnails")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_operations.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username, "role": user.role})
    
    user_operations.create_refresh_token(db, user.id, refresh_token)
    
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@app.post("/refresh", response_model=Token)
async def refresh_access_token(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    access_token = create_access_token(data={"sub": current_user.username, "role": current_user.role})
    refresh_token = create_refresh_token(data={"sub": current_user.username, "role": current_user.role})

    user_operations.delete_refresh_token(db, current_user.id)
    user_operations.create_refresh_token(db, current_user.id, refresh_token)
    
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("user"),
    db: Session = Depends(get_db)
):
    user = UserCreate(username=username, email=email, password=password, role=role)
    db_user = user_operations.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return user_operations.create_user(db=db, user=user)

@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users", response_model=List[UserOut])
async def read_users(db: Session = Depends(get_db), _: bool = Depends(RoleChecker(allowed_roles=["admin"]))):
    return user_operations.get_users(db)

@app.get("/folders", response_model=List[FolderSchema])
async def list_folders(parent: Optional[int] = None, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return file_operations.get_folders(db, current_user, parent)

@app.post("/folders", response_model=FolderSchema, status_code=status.HTTP_201_CREATED)
async def create_folder(folder: FolderCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return file_operations.create_folder(db, current_user, folder.name, folder.parent)

@app.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    file_operations.delete_folder(db, current_user, folder_id)
    return {"status": "success"}

@app.get("/files", response_model=List[FileSchema])
async def list_files(folder: Optional[int] = None, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return file_operations.get_files(db, current_user, folder)

@app.post("/files", response_model=FileSchema)
async def upload_file(
    file: UploadFile,
    folder: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return file_operations.upload_file(db, current_user, file, folder)

@app.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    file_operations.delete_file(db, current_user, file_id)
    return {"status": "success"}

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return file_operations.download_file(db, current_user, file_id)

@app.get("/files/{file_id}/read")
async def read_file(file_id: int, db: Session = Depends(get_db)):
    return file_operations.read_file_content(db, file_id)

@app.get("/login/vk")
async def login_vk_route():
    return vk_login()

@app.get("/vk-callback")
async def vk_callback_route(code: str, db: Session = Depends(get_db)):
    return await vk_callback(code, db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)