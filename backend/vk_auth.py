import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session
from config import VK_CLIENT_ID, VK_CLIENT_SECRET, VK_REDIRECT_URI
from user_operations import get_user_by_username, create_user, update_user_vk_id
from schemas import UserCreate
from auth import create_access_token, create_refresh_token

async def vk_login():
    return {
        "url": f"https://oauth.vk.com/authorize?client_id={VK_CLIENT_ID}&display=page&redirect_uri={VK_REDIRECT_URI}&scope=email&response_type=code&v=5.131"
    }

async def vk_callback(code: str, db: Session):
    async with httpx.AsyncClient() as client:
        token_response = await client.get(
            f"https://oauth.vk.com/access_token?client_id={VK_CLIENT_ID}&client_secret={VK_CLIENT_SECRET}&redirect_uri={VK_REDIRECT_URI}&code={code}"
        )
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        vk_access_token = token_data["access_token"]
        vk_user_id = token_data["user_id"]
        email = token_data.get("email")
        
        user_response = await client.get(
            f"https://api.vk.com/method/users.get?user_ids={vk_user_id}&fields=first_name,last_name&access_token={vk_access_token}&v=5.131"
        )
        user_data = user_response.json()["response"][0]
        
        username = f"vk_{vk_user_id}"
        user = get_user_by_username(db, username)
        if not user:
            user = create_user(db, UserCreate(
                username=username,
                email=email or f"{username}@example.com",
                password="",
                role="user"
            ))
            update_user_vk_id(db, user.id, str(vk_user_id))
        
        access_token = create_access_token(data={"sub": username, "role": user.role})
        refresh_token = create_refresh_token(data={"sub": username, "role": user.role})
        
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}