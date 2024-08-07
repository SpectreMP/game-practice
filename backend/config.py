"""
Configuration parameters for the application.
"""

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES"))
BASE_FOLDER_DIR = os.getenv("BASE_FOLDER_DIR")
THUMBNAIL_DIR = os.getenv("THUMBNAIL_DIR")
BASE_URL = os.getenv("BASE_URL")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")

VK_CLIENT_ID = os.getenv("VK_CLIENT_ID")
VK_CLIENT_SECRET = os.getenv("VK_CLIENT_SECRET")
VK_REDIRECT_URI = os.getenv("VK_REDIRECT_URI")
