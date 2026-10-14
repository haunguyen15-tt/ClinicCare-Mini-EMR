from functools import cache

import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token, hash_password, verify_password
from app.models import Doctor


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
        doctor = db.get(Doctor, int(decode_access_token(token)))
    except (jwt.InvalidTokenError, ValueError):
        doctor = None
    if doctor is None:
        raise UnauthorizedError("Invalid or expired token")
    return doctor
