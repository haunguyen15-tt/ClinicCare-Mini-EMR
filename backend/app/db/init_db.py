import logging
import sqlite3
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.engine import Engine

from app.core.config import BACKEND_DIR, settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal
from app.models import DiagnosisCode, Doctor  # importing app.models registers every table

logger = logging.getLogger(__name__)

SEED_SQL_PATH = BACKEND_DIR / "sql" / "seed_diagnosis_codes.sql"


def seed_diagnosis_codes(engine: Engine, sql_path: Path = SEED_SQL_PATH) -> int:
    """Load the ICD-10 seed file when the table is empty. Returns the number of rows added."""
    raw = engine.raw_connection()
    try:
        # The seed file is plain SQLite SQL, so hand it to the driver as one script.
        conn = raw.driver_connection
        if not isinstance(conn, sqlite3.Connection):
            raise RuntimeError("The diagnosis seed file requires a SQLite database")
        table = DiagnosisCode.__tablename__
        if conn.execute(f"SELECT 1 FROM {table} LIMIT 1").fetchone():
            return 0
        before = conn.total_changes
        conn.executescript(sql_path.read_text(encoding="utf-8"))
        added = conn.total_changes - before
    finally:
        raw.close()

    logger.info("Seeded %d diagnosis codes from %s", added, sql_path.name)
    return added


def seed_demo_doctor(engine: Engine) -> bool:
    """Create the demo doctor from settings unless that username exists. Returns True if added."""
    username = settings.demo_doctor_username.strip()
    if not username:
        return False
    with SessionLocal(bind=engine) as db:
        if db.scalar(select(Doctor.id).where(Doctor.username == username)):
            return False
        password = settings.demo_doctor_password.get_secret_value()
        db.add(
            Doctor(
                username=username,
                full_name=settings.demo_doctor_full_name,
                hashed_password=hash_password(password),
            )
        )
        db.commit()

    logger.info("Created demo doctor %r", username)
    return True


def init_db(engine: Engine) -> None:
    """Create missing tables, seed reference data and the demo doctor.

    The schema is small, so create_all stands in for migrations.
    """
    Base.metadata.create_all(bind=engine)
    seed_diagnosis_codes(engine)
    seed_demo_doctor(engine)
    logger.info("Database ready")
