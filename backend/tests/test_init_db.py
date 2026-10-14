import pytest
from sqlalchemy import func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.db.init_db import init_db, seed_demo_doctor
from app.models import DiagnosisCode, Doctor


def test_init_db_seeds_100_diagnosis_codes_once(engine: Engine) -> None:
    init_db(engine)
    init_db(engine)

    with Session(engine) as db:
        assert db.scalar(select(func.count()).select_from(DiagnosisCode)) == 100
        assert db.get(DiagnosisCode, "E11.9") is not None


def test_demo_doctor_is_skipped_without_a_username(engine: Engine) -> None:
    assert settings.demo_doctor_username == ""
    assert seed_demo_doctor(engine) is False


def test_demo_doctor_is_created_once(engine: Engine, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "demo_doctor_username", "demo")

    assert seed_demo_doctor(engine) is True
    assert seed_demo_doctor(engine) is False

    with Session(engine) as db:
        doctors = db.scalars(select(Doctor)).all()
    assert [d.username for d in doctors] == ["demo"]
    password = settings.demo_doctor_password.get_secret_value()
    assert verify_password(password, doctors[0].hashed_password)
