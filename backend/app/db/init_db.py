import logging
import sqlite3
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app import models  # noqa: F401  (registers every table on Base.metadata)
from app.db.base import Base
from app.models import DiagnosisCode

logger = logging.getLogger(__name__)

SEED_SQL_PATH = Path(__file__).resolve().parents[2] / "sql" / "seed_diagnosis_codes.sql"


def seed_diagnosis_codes(engine: Engine, sql_path: Path = SEED_SQL_PATH) -> int:
    """Load the ICD-10 seed file when the table is empty. Returns the number of rows added."""
    with Session(engine) as session:
        if session.scalar(select(func.count()).select_from(DiagnosisCode)):
            return 0

    script = sql_path.read_text(encoding="utf-8")
    raw = engine.raw_connection()
    try:
        # The seed file is plain SQLite SQL, so hand it to the driver as one script.
        driver_conn = raw.driver_connection
        if not isinstance(driver_conn, sqlite3.Connection):
            raise RuntimeError("The diagnosis seed file requires a SQLite database")
        driver_conn.executescript(script)
        raw.commit()
    finally:
        raw.close()

    with Session(engine) as session:
        count = session.scalar(select(func.count()).select_from(DiagnosisCode)) or 0

    logger.info("Seeded %d diagnosis codes from %s", count, sql_path.name)
    return count


def init_db(engine: Engine) -> None:
    """Create missing tables and seed reference data.

    The schema is small, so create_all stands in for migrations.
    """
    Base.metadata.create_all(bind=engine)
    seed_diagnosis_codes(engine)
    logger.info("Database ready")
