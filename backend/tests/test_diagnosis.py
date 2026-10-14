import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import DiagnosisCode
from tests.conftest import DIAGNOSIS_CODES


def search(client: TestClient, headers: dict[str, str], **params: str | int) -> list[str]:
    response = client.get("/diagnosis", params=params, headers=headers)
    assert response.status_code == 200, response.text
    return [item["code"] for item in response.json()]


def test_requires_authentication(client: TestClient) -> None:
    response = client.get("/diagnosis")

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_empty_search_returns_codes_in_code_order(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    assert search(client, auth_headers) == sorted(DIAGNOSIS_CODES)


def test_returns_code_and_description(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/diagnosis", params={"search": "I10"}, headers=auth_headers)

    assert response.json() == [{"code": "I10", "description": "Essential (primary) hypertension"}]


@pytest.mark.parametrize(
    ("term", "expected"),
    [
        ("E11", ["E11.65", "E11.9"]),
        ("e11", ["E11.65", "E11.9"]),
        ("  e11.9 ", ["E11.9"]),
        ("diabetes", ["E10.9", "E11.65", "E11.9"]),
        ("UNSPECIFIED", ["J06.9", "M54.50", "R07.9"]),
        ("back pain", ["M54.50"]),
        ("no such thing", []),
    ],
)
def test_search_by_code_prefix_or_description(
    client: TestClient, auth_headers: dict[str, str], term: str, expected: list[str]
) -> None:
    assert search(client, auth_headers, search=term) == expected


def test_code_matches_rank_before_description_matches(
    client: TestClient, auth_headers: dict[str, str], db: Session
) -> None:
    db.add(DiagnosisCode(code="A00.0", description="Mentions E11 in its description"))
    db.commit()

    assert search(client, auth_headers, search="E11") == ["E11.65", "E11.9", "A00.0"]


@pytest.mark.parametrize("term", ["%", "_", "E1_.9", "\\"])
def test_like_wildcards_are_matched_literally(
    client: TestClient, auth_headers: dict[str, str], term: str
) -> None:
    assert search(client, auth_headers, search=term) == []


def test_limit_caps_results(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert search(client, auth_headers, limit=2) == ["E10.9", "E11.65"]


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 101}, {"search": "x" * 101}])
def test_rejects_invalid_query_params(
    client: TestClient, auth_headers: dict[str, str], params: dict[str, str | int]
) -> None:
    response = client.get("/diagnosis", params=params, headers=auth_headers)

    assert response.status_code == 422
