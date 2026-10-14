from collections.abc import Sequence

from sqlalchemy import case, or_, select
from sqlalchemy.orm import Session

from app.models import DiagnosisCode


def search_diagnoses(db: Session, search: str | None, limit: int) -> Sequence[DiagnosisCode]:
    """Match codes by prefix or descriptions by substring, case-insensitively.

    Exact code matches come first, then code prefix matches, then description matches.
    An empty search returns the first codes in code order.
    """
    query = select(DiagnosisCode)
    if search:
        code_prefix = DiagnosisCode.code.istartswith(search, autoescape=True)
        rank = case((DiagnosisCode.code == search.upper(), 0), (code_prefix, 1), else_=2)
        query = query.where(
            or_(code_prefix, DiagnosisCode.description.icontains(search, autoescape=True))
        ).order_by(rank)
    query = query.order_by(DiagnosisCode.code).limit(limit)
    return db.scalars(query).all()
