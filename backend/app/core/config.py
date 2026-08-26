import secrets
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AssistanCCTV AI Backend"
    API_V1_STR: str = "/api/v1"
    # In production, change this to a secure random string
    SECRET_KEY: str = "super_secret_for_cctv_project" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SQLite fallback, can be Postgres later
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./sql_app.db"

    class Config:
        case_sensitive = True

settings = Settings()
