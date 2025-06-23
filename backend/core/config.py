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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()