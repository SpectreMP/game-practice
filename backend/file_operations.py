import os
import shutil
from fastapi import HTTPException, UploadFile
from config import BASE_FOLDER_DIR
from schemas import FolderContents, FolderInfo, FileInfo

def create_folder(username: str, folder_name: str):
    folder_path = os.path.join(BASE_FOLDER_DIR, username, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    return {"message": f"Folder '{folder_name}' created successfully"}

def delete_folder(username: str, folder_name: str):
    folder_path = os.path.join(BASE_FOLDER_DIR, username, folder_name)
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=404, detail="Folder not found")
    shutil.rmtree(folder_path)
    return {"message": f"Folder '{folder_name}' deleted successfully"}

def get_folder_contents(username: str) -> FolderContents:
    user_folder = os.path.join(BASE_FOLDER_DIR, username)
    os.makedirs(user_folder, exist_ok=True)
    
    folders = []
    files = []
    for item in os.listdir(user_folder):
        item_path = os.path.join(user_folder, item)
        if os.path.isdir(item_path):
            folders.append(FolderInfo(name=item, path=item_path))
        else:
            files.append(FileInfo(name=item, path=item_path, size=os.path.getsize(item_path)))
    return FolderContents(folders=folders, files=files)

def upload_file(username: str, file: UploadFile, folder: str):
    user_folder = os.path.join(BASE_FOLDER_DIR, username)
    os.makedirs(user_folder, exist_ok=True)
    
    if folder:
        upload_folder = os.path.join(user_folder, folder)
        os.makedirs(upload_folder, exist_ok=True)
    else:
        upload_folder = user_folder
    
    file_path = os.path.join(upload_folder, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": f"File '{file.filename}' uploaded successfully"}

def delete_file(username: str, folder_name: str, file_name: str):
    file_path = os.path.join(BASE_FOLDER_DIR, username, folder_name, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file_path)
    return {"message": f"File '{file_name}' deleted successfully"}

def rename_folder(username: str, old_folder_name: str, new_folder_name: str):
    old_folder_path = os.path.join(BASE_FOLDER_DIR, username, old_folder_name)
    new_folder_path = os.path.join(BASE_FOLDER_DIR, username, new_folder_name)
    
    if not os.path.exists(old_folder_path):
        raise HTTPException(status_code=404, detail="Old folder not found")
    
    if os.path.exists(new_folder_path):
        raise HTTPException(status_code=400, detail="New folder name already exists")
    
    os.rename(old_folder_path, new_folder_path)
    
    return {"message": f"Folder '{old_folder_name}' renamed to '{new_folder_name}' successfully"}