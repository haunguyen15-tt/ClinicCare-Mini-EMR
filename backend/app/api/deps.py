from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import StringConstraints
from sqlalchemy.orm import Session

from app.core.errors import UnauthorizedError
from app.db.session import get_db
from app.models import Doctor
from app.services import auth_service

DbSession = Annotated[Session, Depends(get_db)]

# auto_error=False so a missing token goes through UnauthorizedError like every other 401.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_doctor(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Doctor:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")
    return auth_service.get_doctor_from_token(db, credentials.credentials)


CurrentDoctor = Annotated[Doctor, Depends(get_current_doctor)]

PageLimit = Annotated[int, Query(ge=1, le=100)]

# Text query parameters arrive trimmed, so services only check whether they are empty.
SearchText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
CodePrefix = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, max_length=10)]
