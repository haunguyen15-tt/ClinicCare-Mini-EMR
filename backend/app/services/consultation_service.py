from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import BadRequestError, NotFoundError
from app.models import Consultation, DiagnosisCode, Doctor
from app.schemas.consultation import ConsultationCreate


def create_consultation(db: Session, data: ConsultationCreate, doctor: Doctor) -> Consultation:
    """Save a consultation note by ``doctor``, linked to existing diagnosis codes."""
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
        doctor=doctor,
    )
    db.add(consultation)
    db.commit()
    return consultation


def list_consultations(
    db: Session,
    skip: int,
    limit: int,
    patient: str | None = None,
    diagnosis: str | None = None,
) -> tuple[Sequence[Consultation], int]:
    """Return one page of consultations, newest first, and the total count.

    ``patient`` matches part of the patient name, case-insensitively.
    ``diagnosis`` matches a code exactly or by prefix, so ``E11`` finds every E11.x note.
    """
    filters = []
    if patient:
        filters.append(Consultation.patient_name.icontains(patient, autoescape=True))
    if diagnosis:
        filters.append(
            Consultation.diagnoses.any(DiagnosisCode.code.startswith(diagnosis, autoescape=True))
        )

    total = db.scalar(select(func.count()).select_from(Consultation).where(*filters)) or 0
    items = db.scalars(
        select(Consultation)
        .where(*filters)
        .order_by(Consultation.consultation_date.desc(), Consultation.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return items, total


def get_consultation(db: Session, consultation_id: int) -> Consultation:
    consultation = db.get(Consultation, consultation_id)
    if consultation is None:
        raise NotFoundError("Consultation not found")
    return consultation
