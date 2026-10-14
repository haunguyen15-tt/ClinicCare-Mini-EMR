from fastapi import APIRouter, status

from app.api.deps import DbSession
from app.models import Consultation
from app.schemas.consultation import ConsultationCreate, ConsultationRead
from app.services import consultation_service

router = APIRouter(prefix="/consultation", tags=["consultation"])


@router.post("", response_model=ConsultationRead, status_code=status.HTTP_201_CREATED)
def create_consultation(data: ConsultationCreate, db: DbSession) -> Consultation:
    return consultation_service.create_consultation(db, data)
