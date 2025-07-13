from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    
    SECRET_KEY: str
    DEBUG: bool = True
    
    MAILER_SEND_API_KEY: str
    ORIGIN_EMAIL: str
    
    REDIS_URL: str = "redis://localhost:6379"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BASE_URL: str = "http://localhost:8000"

    AWS_S3_ACCESS_KEY_ID: Optional[str] = None
    AWS_S3_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET_NAME: Optional[str] = None
    AWS_S3_REGION: Optional[str] = None
    AWS_S3_ENDPOINT_URL: Optional[str] = None

    model_config = SettingsConfigDict(env_file="/Users/nicolasgarzon/Codes/HackKind-SequoiaHumaneSociety/.env", extra="ignore")

settings = Settings()