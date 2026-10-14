from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[2]


def sqlite_file_path(url: str) -> Path | None:
    """Return the file path of a file-based SQLite URL, or None for any other database."""
    parsed = make_url(url)
    database = parsed.database
    if parsed.get_backend_name() != "sqlite" or not database or database == ":memory:":
        return None
    if database.startswith("file:"):
        return None
    return Path(database)


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
        path = sqlite_file_path(value)
        if path is None or path.is_absolute():
            return value
        absolute = (BACKEND_DIR / path).resolve().as_posix()
        return make_url(value).set(database=absolute).render_as_string(hide_password=False)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
