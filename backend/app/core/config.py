from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "ClinicCare Mini EMR API"
    database_url: str = "sqlite:///./data/cliniccare.db"
    sql_echo: bool = False

    # Comma-separated in the environment, e.g. "http://localhost:3000,http://127.0.0.1:3000".
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    @field_validator("database_url")
    @classmethod
    def _anchor_sqlite_path(cls, value: str) -> str:
        # Resolve relative SQLite paths against backend/, not the current working directory,
        # so starting uvicorn from another folder never creates a second, empty database.
        url = make_url(value)
        database = url.database
        if url.get_backend_name() != "sqlite" or not database or database == ":memory:":
            return value
        if database.startswith("file:") or Path(database).is_absolute():
            return value
        absolute = (BACKEND_DIR / database).resolve().as_posix()
        query = "&".join(f"{key}={val}" for key, val in url.query.items())
        return f"{url.drivername}:///{absolute}" + (f"?{query}" if query else "")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
