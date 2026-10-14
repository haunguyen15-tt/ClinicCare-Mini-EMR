from collections.abc import Sequence

from sqlalchemy import case, or_, select
from sqlalchemy.orm import Session

from app.models import DiagnosisCode
from app.services.query_utils import LIKE_ESCAPE, escape_like


def search_diagnoses(db: Session, search: str | None, limit: int) -> Sequence[DiagnosisCode]:
    """Match codes by prefix or descriptions by substring, case-insensitively.

    Exact code matches come first, then code prefix matches, then description matches.
    An empty search returns the first codes in code order.
    """
    query = select(DiagnosisCode)
    term = (search or "").strip()
    if term:
        pattern = escape_like(term)
        code_prefix = DiagnosisCode.code.ilike(f"{pattern}%", escape=LIKE_ESCAPE)
        rank = case(
            (DiagnosisCode.code.ilike(pattern, escape=LIKE_ESCAPE), 0),
            (code_prefix, 1),
            else_=2,
        )
        query = query.where(
            or_(
                code_prefix,
                DiagnosisCode.description.ilike(f"%{pattern}%", escape=LIKE_ESCAPE),
            )
        ).order_by(rank)
    query = query.order_by(DiagnosisCode.code).limit(limit)
    return db.scalars(query).all()
