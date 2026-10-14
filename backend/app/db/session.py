from collections.abc import Iterator
from pathlib import Path
from sqlite3 import Connection as SQLite3Connection

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def build_engine(url: str, **kwargs) -> Engine:
    connect_args = {}
    parsed = make_url(url)
    if parsed.get_backend_name() == "sqlite":
        connect_args["check_same_thread"] = False
        # SQLite creates the file but not its folder (e.g. backend/data/).
        if (
            parsed.database
            and parsed.database != ":memory:"
            and not parsed.database.startswith("file:")
        ):
            Path(parsed.database).parent.mkdir(parents=True, exist_ok=True)
    return create_engine(url, connect_args=connect_args, echo=settings.sql_echo, **kwargs)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    # SQLite ignores foreign key constraints unless enabled per connection.
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


engine = build_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
