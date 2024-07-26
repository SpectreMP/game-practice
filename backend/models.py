from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    disabled = Column(Boolean, default=False)
    vk_id = Column(String, unique=True, nullable=True)

    refresh_tokens = relationship("RefreshToken", back_populates="user")
    files = relationship("UserFile", back_populates="user")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="refresh_tokens")
    
class UserFile(Base):
    __tablename__ = "user_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    relative_path = Column(String)
    is_folder = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("user_files.id"), nullable=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    user = relationship("User", back_populates="files")
    parent = relationship("UserFile", remote_side=[id], back_populates="children")
    children = relationship("UserFile", back_populates="parent")