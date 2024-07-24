from pathlib import Path
import shutil
from fastapi.responses import FileResponse
from fastapi import HTTPException, UploadFile
from config import BASE_FOLDER_DIR
from schemas import FolderContents, FileInfo
from sqlalchemy.orm import Session
from models import UserFile, User
from datetime import datetime

def create_folder(db: Session, user: User, folder_name: str, parent_id: int = None):
    parent = None
    if parent_id:
        parent = db.query(UserFile).filter(UserFile.id == parent_id, UserFile.user_id == user.id, UserFile.is_folder == True).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    folder_path = Path(BASE_FOLDER_DIR) / user.username / folder_name
    if parent:
        folder_path = Path(parent.file_path) / folder_name

    new_folder = UserFile(
        user_id=user.id,
        filename=folder_name,
        file_path=str(folder_path),
        is_folder=True,
        parent_id=parent_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    folder_path.mkdir(parents=True, exist_ok=True)

    return new_folder

def delete_folder(db: Session, user: User, folder_id: int):
    folder = db.query(UserFile).filter(UserFile.id == folder_id, UserFile.user_id == user.id, UserFile.is_folder == True).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    delete_recursive(db, folder)

    db.delete(folder)
    db.commit()

    shutil.rmtree(folder.file_path)
    return {"message": f"Folder '{folder.filename}' deleted successfully"}

def delete_recursive(db: Session, item: UserFile):
    for child in item.children:
        delete_recursive(db, child)
        db.delete(child)

def get_folder_contents(db: Session, user: User, folder_id: int = None):
    query = db.query(UserFile).filter(UserFile.user_id == user.id)
    if folder_id:
        query = query.filter(UserFile.parent_id == folder_id)
    else:
        query = query.filter(UserFile.parent_id == None)
    
    return query.all()

def upload_file(db: Session, user: User, file: UploadFile, parent_id: int = None):
    parent = None
    if parent_id:
        parent = db.query(UserFile).filter(UserFile.id == parent_id, UserFile.user_id == user.id, UserFile.is_folder == True).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    file_path = Path(BASE_FOLDER_DIR) / user.username / file.filename
    if parent:
        file_path = Path(parent.file_path) / file.filename

    new_file = UserFile(
        user_id=user.id,
        filename=file.filename,
        file_path=str(file_path),
        is_folder=False,
        parent_id=parent_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return new_file

def delete_file(db: Session, user: User, file_id: int):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id, UserFile.is_folder == False).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    db.delete(file)
    db.commit()

    Path(file.file_path).unlink()
    return {"message": f"File '{file.filename}' deleted successfully"}

def rename_file(db: Session, user: User, file_id: int, new_name: str):
    file = db.query(UserFile).filter(UserFile.id == file_id, UserFile.user_id == user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    old_path = Path(file.file_path)
    new_path = old_path.parent / new_name

    if new_path.exists():
        raise HTTPException(status_code=400, detail="File with this name already exists")

    old_path.rename(new_path)
    file.filename = new_name
    file.file_path = str(new_path)
    file.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(file)

    return file

def download_file(folder_name: str, file_name: str):
    file_path = Path(BASE_FOLDER_DIR) / folder_name / file_name
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=file_name)
