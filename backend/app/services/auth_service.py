import logging
from functools import cache

import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token, hash_password, verify_password
from app.models import Doctor

logger = logging.getLogger(__name__)


@cache
def _dummy_hash() -> str:
    return hash_password("not-a-real-password")


def authenticate(db: Session, username: str, password: str) -> Doctor:
    doctor = db.scalar(select(Doctor).where(Doctor.username == username))
    # Check a dummy hash for unknown users so response time does not reveal which usernames exist.
    hashed = doctor.hashed_password if doctor else _dummy_hash()
    if not verify_password(password, hashed) or doctor is None:
        raise UnauthorizedError("Incorrect username or password")
    return doctor


def get_doctor_from_token(db: Session, token: str) -> Doctor:
    try:
        subject = decode_access_token(token)
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc
    doctor = db.get(Doctor, int(subject)) if subject.isdigit() else None
    if doctor is None:
        raise UnauthorizedError("Invalid or expired token")
    return doctor


def ensure_demo_doctor(db: Session) -> None:
    """Create the demo doctor from settings unless that username already exists."""
    username = settings.demo_doctor_username.strip()
    if not username or db.scalar(select(Doctor.id).where(Doctor.username == username)):
        return
    db.add(
        Doctor(
            username=username,
            full_name=settings.demo_doctor_full_name,
            hashed_password=hash_password(settings.demo_doctor_password),
        )
    )
    db.commit()
    logger.info("Created demo doctor %r", username)
