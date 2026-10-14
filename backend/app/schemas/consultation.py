import re
from datetime import UTC, date, datetime
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)

from app.schemas.diagnosis import DiagnosisRead

# ICD-10-CM: a letter, two characters for the category, then up to four after the dot.
ICD10_CODE_RE = re.compile(r"[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?")


def _normalize_code(value: str) -> str:
    code = value.strip().upper()
    if not ICD10_CODE_RE.fullmatch(code):
        raise ValueError("Must be an ICD-10 code such as E11.9")
    return code


DiagnosisCodeStr = Annotated[str, AfterValidator(_normalize_code)]


def _assume_utc(value: datetime) -> datetime:
    # SQLite drops the timezone on the way back, but every stored timestamp is UTC.
    return value if value.tzinfo else value.replace(tzinfo=UTC)


UTCDateTime = Annotated[datetime, AfterValidator(_assume_utc)]


class ConsultationCreate(BaseModel):
    patient_name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)
    ]
    patient_dob: date | None = None
    notes: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
    diagnosis_codes: list[DiagnosisCodeStr] = Field(min_length=1, max_length=20)

    @field_validator("patient_dob")
    @classmethod
    def _dob_not_in_future(cls, value: date | None) -> date | None:
        if value and value > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return value

    @field_validator("diagnosis_codes")
    @classmethod
    def _codes_unique(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("Diagnosis codes must be unique")
        return value


class ConsultationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str
    patient_dob: date | None
    notes: str
    consultation_date: UTCDateTime
    doctor_id: int | None
    created_at: UTCDateTime
    diagnoses: list[DiagnosisRead]


class ConsultationList(BaseModel):
    items: list[ConsultationRead]
    total: int
