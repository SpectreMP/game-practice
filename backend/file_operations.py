"""
Functions for working with files and folders.
"""

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from models import User, UserFile
from schemas import FolderSchema, FileSchema
from typing import List, Optional
from pathlib import Path
import shutil
from datetime import datetime
from config import BASE_FOLDER_DIR, THUMBNAIL_DIR, BASE_URL
from PIL import Image
from fastapi.responses import FileResponse, StreamingResponse


def get_absolute_path(user: User, relative_path: str) -> Path:
    return Path(BASE_FOLDER_DIR) / user.username / relative_path

def get_folders(db: Session, user: User, parent_id: Optional[int] = None) -> List[FolderSchema]:
    query = db.query(UserFile).filter(UserFile.user_id == user.id, UserFile.is_folder == True)
    query = query.filter(UserFile.parent_id == parent_id if parent_id is not None else UserFile.parent_id == None)
    folders = query.all()
    return [FolderSchema(id=folder.id, name=folder.filename, parent=folder.parent_id) for folder in folders]

def create_folder(db: Session, user: User, folder_name: str, parent_id: Optional[int] = None) -> FolderSchema:
    parent = None
    if parent_id:
        parent = db.query(UserFile).filter(
            UserFile.id == parent_id, 
            UserFile.user_id == user.id, 
            UserFile.is_folder == True
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    relative_path = folder_name if not parent else str(Path(parent.relative_path) / folder_name)
    
    existing_folder = db.query(UserFile).filter(
        UserFile.user_id == user.id,
        UserFile.relative_path == relative_path,
        UserFile.is_folder == True
    ).first()

    if existing_folder:
        raise HTTPException(status_code=400, detail="A folder with this name already exists in the specified location")

    new_folder = UserFile(
        user_id=user.id,
        filename=folder_name,
        relative_path=relative_path,
        is_folder=True,
        parent_id=parent_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    absolute_path = get_absolute_path(user, relative_path)
    absolute_path.mkdir(parents=True, exist_ok=True)

    return FolderSchema(id=new_folder.id, name=new_folder.filename, parent=new_folder.parent_id)

def delete_folder(db: Session, user: User, folder_id: int):
    folder = db.query(UserFile).filter(UserFile.id == folder_id, UserFile.user_id == user.id, UserFile.is_folder == True).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    delete_recursive(db, folder)

    db.delete(folder)
    db.commit()

    absolute_path = get_absolute_path(user, folder.relative_path)
    shutil.rmtree(absolute_path, ignore_errors=True)

def get_files(db: Session, user: User, folder_id: Optional[int] = None) -> List[FileSchema]:
    query = db.query(UserFile).filter(UserFile.user_id == user.id, UserFile.is_folder == False)
    query = query.filter(UserFile.parent_id == folder_id if folder_id else UserFile.parent_id == None)
    
    files = query.all()
    file_schemas = []
    
    for file in files:
        absolute_path = get_absolute_path(user, file.relative_path)
        thumbnail_path = get_thumbnail_path(absolute_path, user.username)
        
        file_schemas.append(FileSchema(
            id=file.id,
            name=file.filename,
            url=f"{BASE_URL}/api/files/{file.id}/download",
            size=absolute_path.stat().st_size,
            folder=file.parent_id,
            thumbnail=thumbnail_path
        ))
    
    return file_schemas

def create_thumbnail(file_path: Path, user_username: str, thumbnail_size=(100, 100)) -> str:
    user_thumbnail_dir = Path(THUMBNAIL_DIR) / user_username
    user_thumbnail_dir.mkdir(parents=True, exist_ok=True)
    
    thumbnail_path = user_thumbnail_dir / f"th_{file_path.stem}.webp"
    
    with Image.open(file_path) as img:
        img.thumbnail(thumbnail_size)
        img.save(thumbnail_path, "WEBP")
    
    return f"{BASE_URL}/api/thumbnails/{user_username}/{thumbnail_path.name}"

def get_thumbnail_path(file_path: Path, user_username: str) -> str:
    if file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
        return create_thumbnail(file_path, user_username)
    else:
        return f"{BASE_URL}/path/to/default/icon.png"

def upload_file(db: Session, user: User, file: UploadFile, folder_id: Optional[int] = None) -> FileSchema:
    parent = None
    if folder_id:
        parent = db.query(UserFile).filter(UserFile.id == folder_id, UserFile.user_id == user.id, UserFile.is_folder == True).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    relative_path = file.filename if not parent else str(Path(parent.relative_path) / file.filename)

    new_file = UserFile(
        user_id=user.id,
        filename=file.filename,
        relative_path=relative_path,
        is_folder=False,
        parent_id=folder_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    absolute_path = get_absolute_path(user, relative_path)
    with absolute_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    thumbnail_path = get_thumbnail_path(absolute_path, user.username)

    return FileSchema(
        id=new_file.id,
        name=new_file.filename,
        url=f"{BASE_URL}/api/files/{new_file.id}/download",
        size=absolute_path.stat().st_size,
        folder=new_file.parent_id,
        thumbnail=thumbnail_path
    )

def delete_file(db: Session, user: User, file_id: int):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id, UserFile.is_folder == False).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    absolute_path = get_absolute_path(user, file.relative_path)
    thumbnail_path = Path(THUMBNAIL_DIR) / user.username / f"th_{absolute_path.stem}.webp"

    db.delete(file)
    db.commit()

    absolute_path.unlink(missing_ok=True)
    thumbnail_path.unlink(missing_ok=True)
  
def delete_recursive(db: Session, item: UserFile):
    for child in item.children:
        delete_recursive(db, child)
        db.delete(child)
        
def download_file(db: Session, user: User, file_id: int):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    absolute_path = get_absolute_path(user, file.relative_path)
    if not absolute_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=absolute_path, 
        filename=file.filename, 
        media_type='application/octet-stream'
    )

def read_file_content(db: Session, file_id: int):
    file = db.query(UserFile).filter(UserFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    absolute_path=Path(BASE_FOLDER_DIR) / 'admin' / file.relative_path # hardcoded by now
   
    try:
        with open(absolute_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"id": file.id, "name": file.filename, "content": content}
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")