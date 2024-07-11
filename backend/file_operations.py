from pathlib import Path
import shutil
from fastapi.responses import FileResponse
from fastapi import HTTPException, UploadFile
from config import BASE_FOLDER_DIR
from schemas import FolderContents, FolderInfo, FileInfo

def create_folder(username: str, folder_name: str):
    folder_path = Path(BASE_FOLDER_DIR) / username / folder_name
    folder_path.mkdir(parents=True, exist_ok=True)
    return {"message": f"Folder '{folder_name}' created successfully"}

def delete_folder(username: str, folder_name: str):
    folder_path = Path(BASE_FOLDER_DIR) / username / folder_name
    if not folder_path.exists():
        raise HTTPException(status_code=404, detail="Folder not found")
    shutil.rmtree(folder_path)
    return {"message": f"Folder '{folder_name}' deleted successfully"}

def get_folder_contents(username: str) -> FolderContents:
    user_folder = Path(BASE_FOLDER_DIR) / username
    user_folder.mkdir(parents=True, exist_ok=True)
    
    folders = []
    files = []
    for item in user_folder.iterdir():
        if item.is_dir():
            folders.append(FolderInfo(name=item.name, path=str(item)))
        else:
            files.append(FileInfo(name=item.name, path=str(item), size=item.stat().st_size))
    return FolderContents(folders=folders, files=files)

def upload_file(username: str, file: UploadFile, folder: str):
    user_folder = Path(BASE_FOLDER_DIR) / username
    user_folder.mkdir(parents=True, exist_ok=True)
    
    if folder:
        upload_folder = user_folder / folder
        upload_folder.mkdir(parents=True, exist_ok=True)
    else:
        upload_folder = user_folder
    
    file_path = upload_folder / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": f"File '{file.filename}' uploaded successfully"}

def delete_file(username: str, folder_name: str, file_name: str):
    file_path = Path(BASE_FOLDER_DIR) / username / folder_name / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    file_path.unlink()
    return {"message": f"File '{file_name}' deleted successfully"}

def rename_folder(username: str, old_folder_name: str, new_folder_name: str):
    old_folder_path = Path(BASE_FOLDER_DIR) / username / old_folder_name
    new_folder_path = Path(BASE_FOLDER_DIR) / username / new_folder_name
    
    if not old_folder_path.exists():
        raise HTTPException(status_code=404, detail="Old folder not found")
    
    if new_folder_path.exists():
        raise HTTPException(status_code=400, detail="New folder name already exists")
    
    old_folder_path.rename(new_folder_path)
    
    return {"message": f"Folder '{old_folder_name}' renamed to '{new_folder_name}' successfully"}

def download_file(folder_name: str, file_name: str):
    file_path = Path(BASE_FOLDER_DIR) / folder_name / file_name
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, filename=file_name)
