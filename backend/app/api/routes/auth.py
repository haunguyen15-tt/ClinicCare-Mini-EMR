from fastapi import APIRouter

from app.api.deps import CurrentDoctor, DbSession
from app.core.security import create_access_token
from app.models import Doctor
from app.schemas.auth import DoctorRead, LoginRequest, Token
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(data: LoginRequest, db: DbSession) -> Token:
    doctor = auth_service.authenticate(db, data.username, data.password)
    return Token(access_token=create_access_token(str(doctor.id)))


@router.get("/me", response_model=DoctorRead)
def read_current_doctor(doctor: CurrentDoctor) -> Doctor:
    return doctor
