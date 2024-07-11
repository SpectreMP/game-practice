from sqlalchemy.orm import Session
from models import User, RefreshToken
from schemas import UserCreate
from password_utils import get_password_hash, verify_password
from datetime import datetime, timedelta

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_refresh_token(db: Session, user_id: int, token: str):
    db_token = RefreshToken(user_id=user_id, token=token, expires_at=datetime.utcnow() + timedelta(days=30))
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def delete_refresh_token(db: Session, user_id: int):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()

def update_user_vk_id(db: Session, user_id: int, vk_id: str):
    user = get_user(db, user_id)
    if user:
        user.vk_id = vk_id
        db.commit()
        db.refresh(user)
    return user