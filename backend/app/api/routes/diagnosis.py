from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.models import DiagnosisCode
from app.schemas.diagnosis import DiagnosisRead
from app.services import diagnosis_service

router = APIRouter(prefix="/diagnosis", tags=["diagnosis"])


@router.get("", response_model=list[DiagnosisRead])
def search_diagnoses(
    db: DbSession,
    search: Annotated[
        str | None,
        Query(max_length=100, description="Code prefix (e.g. E11) or words from the description"),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Sequence[DiagnosisCode]:
    return diagnosis_service.search_diagnoses(db, search, limit)
