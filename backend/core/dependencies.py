from fastapi import Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User
from fastapi.security import APIKeyHeader

oauth2_scheme = APIKeyHeader(name="Authorization")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    raw_token = token.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Missing sub in token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

