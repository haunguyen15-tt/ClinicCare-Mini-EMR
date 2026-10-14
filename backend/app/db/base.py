from datetime import UTC, datetime

from sqlalchemy.orm import DeclarativeBase


def utcnow() -> datetime:
    """Timezone-aware 'now', used as the default for timestamp columns."""
    return datetime.now(UTC)


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""
