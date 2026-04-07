from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional
import os
from pathlib import Path

# Get the backend directory (parent of app directory)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    # Database settings
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "school_management"
    DATABASE_URL: Optional[str] = None

    # CORS
    # Comma-separated list, e.g. "http://localhost:3000,https://your-app.vercel.app"
    CORS_ORIGINS: Optional[str] = None
    # Optional regex for origins, e.g. r"^https://.*\.vercel\.app$"
    CORS_ORIGIN_REGEX: Optional[str] = None

    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Special School Management System"
    
    # Hugging Face settings
    HUGGINGFACE_API_TOKEN: Optional[str] = None
    # Hugging Face Inference endpoint.
    # HF deprecated `https://api-inference.huggingface.co`; use router by default.
    HUGGINGFACE_BASE_URL: str = "https://router.huggingface.co"

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = 'utf-8'
        extra = 'ignore'

    @model_validator(mode="after")
    def _validate_db_settings(self):
        """Allow DATABASE_URL-only deployments (Render/Neon).

        If DATABASE_URL is not provided, require the POSTGRES_* fields.
        """
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            return self

        missing = []
        if not self.POSTGRES_USER:
            missing.append("POSTGRES_USER")
        if not self.POSTGRES_PASSWORD:
            missing.append("POSTGRES_PASSWORD")
        if not self.POSTGRES_DB:
            missing.append("POSTGRES_DB")

        if missing:
            raise ValueError(
                "Database is not configured. Provide DATABASE_URL, or set: "
                + ", ".join(missing)
            )
        return self

    def get_database_url(self) -> str:
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            url = self.DATABASE_URL.strip()
            if (url.startswith("\"") and url.endswith("\"")) or (url.startswith("'") and url.endswith("'")):
                url = url[1:-1]
            return url

        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

settings = Settings()