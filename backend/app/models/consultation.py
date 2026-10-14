from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, Date, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, utcnow

if TYPE_CHECKING:
    from app.models.diagnosis import DiagnosisCode
    from app.models.doctor import Doctor


consultation_diagnoses = Table(
    "consultation_diagnoses",
    Base.metadata,
    Column(
        "consultation_id",
        ForeignKey("consultations.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "diagnosis_code",
        ForeignKey("diagnosis_codes.code", ondelete="RESTRICT"),
        primary_key=True,
        index=True,
    ),
)


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_name: Mapped[str] = mapped_column(String(100))
    patient_dob: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str] = mapped_column(Text)
    consultation_date: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    doctor_id: Mapped[int | None] = mapped_column(
        ForeignKey("doctors.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    doctor: Mapped[Doctor | None] = relationship(back_populates="consultations", lazy="joined")
    diagnoses: Mapped[list[DiagnosisCode]] = relationship(
        secondary=consultation_diagnoses, order_by="DiagnosisCode.code", lazy="selectin"
    )

    @property
    def doctor_name(self) -> str | None:
        return self.doctor.full_name if self.doctor else None

    def __repr__(self) -> str:
        return f"Consultation(id={self.id!r}, patient={self.patient_name!r})"
