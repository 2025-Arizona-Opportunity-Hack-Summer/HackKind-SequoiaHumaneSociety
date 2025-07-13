from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from  core.config import settings
from  core.database import get_db
from  models.user import User

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        token = request.cookies.get("access_token")
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        if payload.get("type") != "access":
            return None
            
    except JWTError as e:
        pass

    try:
        if not isinstance(user_id, (str, int)):
            return None
        
        user_id_str = str(user_id)
        
        if not user_id_str.isdigit():
            return None
        
        user_id_int = int(user_id_str)
        
        if user_id_int <= 0:
            return None
            
    except (ValueError, AttributeError) as e:
        pass

    try:
        user = db.query(User).filter(User.id == user_id_int).first()
        if not user:
            pass
        return user
    except Exception as e:
        pass
        return None

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = get_optional_user(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user