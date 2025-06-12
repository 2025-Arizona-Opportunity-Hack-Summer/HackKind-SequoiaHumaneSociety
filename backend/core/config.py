from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    MAILER_SEND_API_KEY: str
    ORIGIN_EMAIL: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()