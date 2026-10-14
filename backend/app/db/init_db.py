import logging

from sqlalchemy.engine import Engine

from app import models  # noqa: F401  (registers every table on Base.metadata)
from app.db.base import Base

logger = logging.getLogger(__name__)


def init_db(engine: Engine) -> None:
    """Create missing tables. The schema is small, so create_all stands in for migrations."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ready")
