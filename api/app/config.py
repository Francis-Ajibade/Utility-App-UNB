from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "Inventory API"

    supabase_url: str
    supabase_anon_key: str

    web_origin: str = "http://localhost:5173"


settings = Settings()
