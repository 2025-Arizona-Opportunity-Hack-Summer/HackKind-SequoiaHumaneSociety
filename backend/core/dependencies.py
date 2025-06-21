from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    token = request.cookies.get("access_token")
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    try:
        if not isinstance(user_id, (str, int)):
            return None
        
        user_id_str = str(user_id)
        
        if not user_id_str.isdigit():
            return None
        
        user_id_int = int(user_id_str)
        
        if user_id_int <= 0:
            return None
            
    except ValueError:
        return None

    user = db.query(User).filter(User.id == user_id_int).first()
    return user

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_optional_user(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user