import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "healthcare"
    GEMINI_API_KEY: str = ""
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Gemini model names
    TRIAGE_MODEL: str = "gemini-2.5-flash"
    SPECIALIST_MODEL: str = "gemini-2.5-flash" #gemini-2.5-pro-preview-06-05

    class Config:
        env_file = ".env"

settings = Settings()
