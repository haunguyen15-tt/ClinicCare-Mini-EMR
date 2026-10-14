"""Password hashing (bcrypt) and access tokens (JWT, HS256)."""

from datetime import timedelta

import bcrypt
import jwt

from app.core.config import settings
from app.db.base import utcnow

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed_password.encode())
    except ValueError:
        # bcrypt rejects passwords over 72 bytes and malformed hashes; neither can match.
        return False


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    now = utcnow()
    expires_at = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": subject, "iat": now, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """Return the token subject. Raises ``jwt.InvalidTokenError`` if invalid or expired."""
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "exp"]},
    )
    return payload["sub"]
