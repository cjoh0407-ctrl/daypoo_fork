from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "DayPoo AI Service"
    API_V1_STR: str = "/api/v1"
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = "YOUR_OPENAI_API_KEY_HERE"
    MODEL_NAME: str = "gpt-4o" # Using GPT-4o for vision analysis
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
