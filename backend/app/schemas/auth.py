from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints


class LoginRequest(BaseModel):
    username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DoctorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
