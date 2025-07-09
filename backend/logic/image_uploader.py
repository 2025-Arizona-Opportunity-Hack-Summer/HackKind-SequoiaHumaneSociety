import os
import shutil
from uuid import uuid4
from pathlib import Path
from fastapi import HTTPException, UploadFile
from PIL import Image
import magic
from io import BytesIO
from backend.core.config import settings
import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError, ClientError

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

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL or None
    )

def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    s3 = get_s3_client()
    bucket = settings.AWS_S3_BUCKET_NAME
    if not bucket:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")
    try:
        s3.put_object(
            Bucket=bucket,
            Key=filename,
            Body=file_bytes,
            ContentType=content_type,
        )
        # Generate public or presigned URL
        region = settings.AWS_S3_REGION
        endpoint = settings.AWS_S3_ENDPOINT_URL
        if endpoint:
            url = f"{endpoint.rstrip('/')}/{bucket}/{filename}"
        else:
            url = f"https://{bucket}.s3.{region}.amazonaws.com/{filename}"
        return url
    except (BotoCoreError, NoCredentialsError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image to S3: {e}")

async def upload_pet_photo_local(file: UploadFile, pet_id: int, original_filename: str) -> str:
    # This function now uploads to S3 instead of local disk
    content = await file.read()
    file_like_object = BytesIO(content)
    validate_image_file(file_like_object, original_filename)
    safe_filename = sanitize_filename(original_filename)
    file_ext = Path(safe_filename).suffix.lower()
    unique_name = f"pet_{pet_id}_{uuid4().hex}{file_ext}"
    # Optionally, process image in memory (resize, etc.)
    # Save to a temp file, process, then upload processed bytes
    temp_path = None
    try:
        # Save to a temp file for processing
        temp_path = f"/tmp/{unique_name}"
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        validate_and_process_image(temp_path)
        with open(temp_path, "rb") as processed_file:
            processed_bytes = processed_file.read()
        # Guess content type
        content_type = file.content_type or 'image/jpeg'
        url = upload_to_s3(processed_bytes, unique_name, content_type)
        return url
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)