from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import BadRequestError, NotFoundError
from app.models import Consultation, DiagnosisCode
from app.schemas.consultation import ConsultationCreate


def create_consultation(db: Session, data: ConsultationCreate) -> Consultation:
    """Save a consultation note linked to existing diagnosis codes."""
    diagnoses = db.scalars(
        select(DiagnosisCode)
        .where(DiagnosisCode.code.in_(data.diagnosis_codes))
        .order_by(DiagnosisCode.code)
    ).all()
    unknown = set(data.diagnosis_codes) - {d.code for d in diagnoses}
    if unknown:
        raise BadRequestError(f"Unknown diagnosis code(s): {', '.join(sorted(unknown))}")

    consultation = Consultation(
        patient_name=data.patient_name,
        patient_dob=data.patient_dob,
        notes=data.notes,
        diagnoses=list(diagnoses),
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation


def list_consultations(db: Session, skip: int, limit: int) -> tuple[Sequence[Consultation], int]:
    """Return one page of consultations, newest first, and the total count."""
    total = db.scalar(select(func.count()).select_from(Consultation)) or 0
    items = db.scalars(
        select(Consultation)
        .options(selectinload(Consultation.diagnoses))
        .order_by(Consultation.consultation_date.desc(), Consultation.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return items, total


def get_consultation(db: Session, consultation_id: int) -> Consultation:
    consultation = db.get(
        Consultation, consultation_id, options=[selectinload(Consultation.diagnoses)]
    )
    if consultation is None:
        raise NotFoundError("Consultation not found")
    return consultation
