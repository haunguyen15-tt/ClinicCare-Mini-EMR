from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DiagnosisCode(Base):
    __tablename__ = "diagnosis_codes"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    description: Mapped[str] = mapped_column(String(255))

    def __repr__(self) -> str:
        return f"DiagnosisCode({self.code!r})"
