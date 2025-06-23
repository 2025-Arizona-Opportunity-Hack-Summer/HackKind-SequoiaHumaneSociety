import os
import shutil
from uuid import uuid4
from pathlib import Path
from fastapi import HTTPException, UploadFile
from PIL import Image
import magic
from io import BytesIO
from backend.core.config import settings

UPLOAD_DIR = "backend/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  
MAX_IMAGE_DIMENSION = 2048  

def validate_image_file(file: BytesIO, filename: str) -> None:
    
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    file_size = len(file.getvalue())
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file not allowed")
    
    try:
        file.seek(0)
        file_content = file.read(1024)  
        file.seek(0)  
        
        mime_type = magic.from_buffer(file_content, mime=True)
        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file content. File appears to be: {mime_type}"
            )
    except Exception:
        raise HTTPException(status_code=400, detail="Could not validate file type")

def sanitize_filename(filename: str) -> str:
    safe_name = Path(filename).name
    safe_name = "".join(c for c in safe_name if c.isalnum() or c in '._-')
    
    if not safe_name or safe_name.startswith('.'):
        safe_name = f"image{Path(filename).suffix.lower()}"
    
    return safe_name

def validate_and_process_image(file_path: str) -> None:
    try:
        with Image.open(file_path) as img:
            width, height = img.size
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
                
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                rgb_img.save(file_path, 'JPEG', optimize=True, quality=85)
                
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="Invalid image file")

async def upload_pet_photo_local(file: UploadFile, pet_id: int, original_filename: str) -> str:
    
    content = await file.read()
    file_like_object = BytesIO(content)
    
    validate_image_file(file_like_object, original_filename)
    
    safe_filename = sanitize_filename(original_filename)
    
    file_ext = Path(safe_filename).suffix.lower()
    unique_name = f"pet_{pet_id}_{uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        validate_and_process_image(file_path)
        
        return f"{settings.BASE_URL}/static/uploads/{unique_name}"
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e