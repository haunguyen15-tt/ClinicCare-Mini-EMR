from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import BadRequestError
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
