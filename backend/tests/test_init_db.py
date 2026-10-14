from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.db.demo_data import DEMO_CONSULTATIONS
from app.db.init_db import init_db, seed_demo_consultations, seed_demo_doctor
from app.models import Consultation, DiagnosisCode, Doctor


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


def test_demo_consultations_are_added_once_for_the_demo_doctor(
    engine: Engine, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "demo_doctor_username", "demo")
    monkeypatch.setattr(settings, "demo_consultations", True)
    init_db(engine)
    init_db(engine)

    with Session(engine) as db:
        consultations = db.scalars(select(Consultation)).unique().all()
        assert len(consultations) == len(DEMO_CONSULTATIONS)
        assert {c.doctor.username for c in consultations if c.doctor} == {"demo"}
        # Every sample code exists, so each note keeps all of its codes.
        for consultation, demo in zip(
            sorted(consultations, key=lambda c: c.id), DEMO_CONSULTATIONS, strict=True
        ):
            assert tuple(sorted(d.code for d in consultation.diagnoses)) == tuple(
                sorted(demo.codes)
            )
            assert consultation.consultation_date <= datetime.now(UTC)


def test_demo_consultations_are_skipped_when_turned_off(
    engine: Engine, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "demo_doctor_username", "demo")
    assert settings.demo_consultations is False
    init_db(engine)

    with Session(engine) as db:
        assert db.scalar(select(func.count()).select_from(Consultation)) == 0


def test_demo_consultations_never_join_existing_notes(
    engine: Engine, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "demo_doctor_username", "demo")
    init_db(engine)
    with Session(engine) as db:
        db.add(Consultation(patient_name="Existing Patient", notes="Already on file."))
        db.commit()

    monkeypatch.setattr(settings, "demo_consultations", True)
    assert seed_demo_consultations(engine) == 0
