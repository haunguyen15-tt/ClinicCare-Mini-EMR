import os

# Settings are read when the app is imported, so pin them before any app import.
# Environment variables take precedence over backend/.env.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256"
os.environ["DEMO_DOCTOR_USERNAME"] = ""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import DiagnosisCode, Doctor

DOCTOR_PASSWORD = "correct-horse-battery"

DIAGNOSIS_CODES = {
    "E10.9": "Type 1 diabetes mellitus without complications",
    "E11.65": "Type 2 diabetes mellitus with hyperglycemia",
    "E11.9": "Type 2 diabetes mellitus without complications",
    "I10": "Essential (primary) hypertension",
    "J06.9": "Acute upper respiratory infection, unspecified",
    "M54.50": "Low back pain, unspecified",
    "R07.9": "Chest pain, unspecified",
}


@pytest.fixture(scope="session")
def doctor_password_hash() -> str:
    # bcrypt is slow on purpose; hash the shared test password once per run.
    return hash_password(DOCTOR_PASSWORD)


@pytest.fixture
def engine() -> Iterator[Engine]:
    # One in-memory database per test; StaticPool keeps it on a single shared connection.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def db(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """Session for arranging and inspecting data directly in tests."""
    with session_factory() as session:
        session.add_all(DiagnosisCode(code=c, description=d) for c, d in DIAGNOSIS_CODES.items())
        session.commit()
        yield session


@pytest.fixture
def client(db: Session, session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    # Not used as a context manager, so the lifespan (init_db on the real engine) never runs.
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def doctor(db: Session, doctor_password_hash: str) -> Doctor:
    doctor = Doctor(
        username="dr.house", full_name="Dr. Gregory House", hashed_password=doctor_password_hash
    )
    db.add(doctor)
    db.commit()
    return doctor


@pytest.fixture
def auth_headers(doctor: Doctor) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(str(doctor.id))}"}
