from typing import Annotated

from fastapi import Depends, Query
from pydantic import StringConstraints
from sqlalchemy.orm import Session

from app.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]

PageLimit = Annotated[int, Query(ge=1, le=100)]

# Text query parameters arrive trimmed, so services only check whether they are empty.
SearchText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
CodePrefix = Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, max_length=10)]
