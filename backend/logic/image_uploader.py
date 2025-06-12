import os
import shutil
from uuid import uuid4

UPLOAD_DIR = "backend/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def upload_pet_photo_local(file, pet_id: int, original_filename: str) -> str:
    unique_name = f"pet_{pet_id}_{uuid4().hex}_{original_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file, buffer)

    return f"http://localhost:8000/static/uploads/{unique_name}"

