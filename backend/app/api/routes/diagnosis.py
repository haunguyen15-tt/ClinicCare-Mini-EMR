from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, PageLimit, SearchText, get_current_doctor
from app.models import DiagnosisCode
from app.schemas.diagnosis import DiagnosisRead
from app.services import diagnosis_service

router = APIRouter(
    prefix="/diagnosis", tags=["diagnosis"], dependencies=[Depends(get_current_doctor)]
)


@router.get("", response_model=list[DiagnosisRead])
def search_diagnoses(
    db: DbSession,
    search: Annotated[
        SearchText | None,
        Query(description="Code prefix (e.g. E11) or words from the description"),
    ] = None,
    limit: PageLimit = 20,
) -> Sequence[DiagnosisCode]:
    return diagnosis_service.search_diagnoses(db, search, limit)
