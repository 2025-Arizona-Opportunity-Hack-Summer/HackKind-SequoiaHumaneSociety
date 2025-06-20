from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    MAILER_SEND_API_KEY: str
    ORIGIN_EMAIL: str
    REDIS_URL: str = "redis://localhost:6379"  # Default Redis URL

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()