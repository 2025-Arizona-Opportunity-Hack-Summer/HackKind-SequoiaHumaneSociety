from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="No authentication token found")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        if not isinstance(user_id, (str, int)):
            raise HTTPException(status_code=401, detail="Invalid token: malformed user ID")
        
        user_id_str = str(user_id)
        
        if not user_id_str.isdigit():
            raise HTTPException(status_code=401, detail="Invalid token: invalid user ID format")
        
        user_id_int = int(user_id_str)
        
        if user_id_int <= 0:
            raise HTTPException(status_code=401, detail="Invalid token: invalid user ID")
            
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token: user ID conversion error")

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user