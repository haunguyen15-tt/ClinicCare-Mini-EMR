from datetime import timedelta

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import JWT_ALGORITHM, create_access_token
from app.db.base import utcnow
from app.models import Doctor
from tests.conftest import DOCTOR_PASSWORD


def login(client: TestClient, username: str, password: str):
    return client.post("/auth/login", json={"username": username, "password": password})


def sign(payload: dict[str, object], secret: str | None = None) -> str:
    key = secret or settings.jwt_secret.get_secret_value()
    return jwt.encode(payload, key, algorithm=JWT_ALGORITHM)


def test_login_returns_a_working_bearer_token(client: TestClient, doctor: Doctor) -> None:
    response = login(client, "dr.house", DOCTOR_PASSWORD)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json() == {"id": doctor.id, "username": "dr.house", "full_name": "Dr. Gregory House"}


def test_login_trims_the_username(client: TestClient, doctor: Doctor) -> None:
    assert login(client, "  dr.house ", DOCTOR_PASSWORD).status_code == 200


@pytest.mark.parametrize(
    ("username", "password"),
    [
        ("dr.house", "wrong-password"),
        ("nobody", DOCTOR_PASSWORD),
        ("DR.HOUSE", DOCTOR_PASSWORD),
        # bcrypt only accepts 72 bytes; longer passwords must fail cleanly, not with a 500.
        ("dr.house", "x" * 100),
    ],
)
def test_login_rejects_bad_credentials_with_the_same_message(
    client: TestClient, doctor: Doctor, username: str, password: str
) -> None:
    response = login(client, username, password)

    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}
    assert response.headers["WWW-Authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"username": "dr.house"},
        {"username": "   ", "password": "x"},
        {"username": "dr.house", "password": ""},
        {"username": "dr.house", "password": "x" * 129},
    ],
)
def test_login_validates_the_body(client: TestClient, body: dict[str, str]) -> None:
    assert client.post("/auth/login", json=body).status_code == 422


@pytest.mark.parametrize(
    "authorization",
    [None, "Basic ZHI6cGFzcw==", "Bearer", "Bearer not-a-jwt"],
)
def test_me_rejects_missing_or_malformed_credentials(
    client: TestClient, authorization: str | None
) -> None:
    headers = {"Authorization": authorization} if authorization else {}

    response = client.get("/auth/me", headers=headers)

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_me_rejects_tokens_that_do_not_verify(client: TestClient, doctor: Doctor) -> None:
    now = utcnow()
    valid_claims = {"sub": str(doctor.id), "exp": now + timedelta(minutes=5)}
    tokens = {
        "expired": sign({"sub": str(doctor.id), "exp": now - timedelta(seconds=1)}),
        "wrong secret": sign(valid_claims, secret="another-secret-that-is-also-long-enough"),
        "missing exp": sign({"sub": str(doctor.id)}),
        "non-numeric subject": sign({**valid_claims, "sub": "dr.house"}),
        "unknown doctor": create_access_token("999"),
        "unsigned": jwt.encode(valid_claims, key=None, algorithm="none"),
    }

    for name, token in tokens.items():
        response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401, name
        assert response.json() == {"detail": "Invalid or expired token"}, name
