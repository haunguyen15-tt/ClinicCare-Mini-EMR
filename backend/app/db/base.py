from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator


def utcnow() -> datetime:
    """Timezone-aware 'now', used as the default for timestamp columns."""
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator[datetime]):
    """Store timestamps as UTC and always read them back timezone-aware.

    SQLite has no timezone support and drops the offset, so values are converted to UTC
    on the way in and tagged as UTC on the way out.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Timestamps must be timezone-aware")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None or value.tzinfo is not None:
            return value
        return value.replace(tzinfo=UTC)


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""

    type_annotation_map = {datetime: UTCDateTime}
