from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    DEBUG: bool = True  # Set to False in production
    
    # Email
    MAILER_SEND_API_KEY: str
    ORIGIN_EMAIL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"  # Default Redis URL
    
    # JWT Settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days

    # API Base URL
    BASE_URL: str = "http://localhost:8000"

    # AWS S3
    AWS_S3_ACCESS_KEY_ID: Optional[str] = None
    AWS_S3_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET_NAME: Optional[str] = None
    AWS_S3_REGION: Optional[str] = None
    AWS_S3_ENDPOINT_URL: Optional[str] = None  # Optional, for custom endpoints or localstack

    model_config = SettingsConfigDict(env_file="/Users/nicolasgarzon/Codes/HackKind-SequoiaHumaneSociety/.env", extra="ignore")

settings = Settings()