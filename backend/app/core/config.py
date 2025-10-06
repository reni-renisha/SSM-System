from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv
import os
from pathlib import Path

# Get the path to the .env file
env_path = Path(__file__).parent.parent.parent / ".env"
print(f"DEBUG: Looking for .env file at: {env_path}")
print(f"DEBUG: .env file exists: {env_path.exists()}")

# Load .env file explicitly
load_dotenv(dotenv_path=env_path)

# Test direct access
print(f"DEBUG: Direct os.getenv('GEMINI_API_KEY'): {os.getenv('GEMINI_API_KEY')[:10] + '...' if os.getenv('GEMINI_API_KEY') else 'None'}")

class Settings(BaseSettings):
    # Database settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "school_management"
    DATABASE_URL: Optional[str] = None

    # JWT settings
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Special School Management System"
    
    # AI settings  
    GEMINI_API_KEY: Optional[str] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure API key is loaded
        if not self.GEMINI_API_KEY:
            self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        print(f"DEBUG: Final GEMINI_API_KEY in Settings: {self.GEMINI_API_KEY[:10] + '...' if self.GEMINI_API_KEY else 'None'}")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()

# Debug: Print loaded settings (remove in production)
print(f"DEBUG: Settings loaded from .env")
print(f"DEBUG: POSTGRES_USER = {settings.POSTGRES_USER}")
print(f"DEBUG: GEMINI_API_KEY = {settings.GEMINI_API_KEY[:10] + '...' if settings.GEMINI_API_KEY else 'None'}")
print(f"DEBUG: SECRET_KEY = {settings.SECRET_KEY[:10] + '...' if settings.SECRET_KEY else 'None'}") 