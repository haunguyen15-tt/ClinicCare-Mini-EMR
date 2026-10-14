from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import DbSession
from app.models import Consultation
from app.schemas.consultation import ConsultationCreate, ConsultationList, ConsultationRead
from app.services import consultation_service

router = APIRouter(prefix="/consultation", tags=["consultation"])


@router.post("", response_model=ConsultationRead, status_code=status.HTTP_201_CREATED)
def create_consultation(data: ConsultationCreate, db: DbSession) -> Consultation:
    return consultation_service.create_consultation(db, data)


@router.get("", response_model=ConsultationList)
def list_consultations(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    patient: Annotated[
        str | None, Query(max_length=100, description="Part of the patient name")
    ] = None,
    diagnosis: Annotated[
        str | None, Query(max_length=10, description="Diagnosis code or code prefix, e.g. E11")
    ] = None,
) -> ConsultationList:
    items, total = consultation_service.list_consultations(db, skip, limit, patient, diagnosis)
    return ConsultationList.model_validate({"items": items, "total": total}, from_attributes=True)


@router.get("/{consultation_id}", response_model=ConsultationRead)
def get_consultation(consultation_id: int, db: DbSession) -> Consultation:
    return consultation_service.get_consultation(db, consultation_id)
