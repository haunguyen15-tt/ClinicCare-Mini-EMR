from datetime import date, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Consultation, DiagnosisCode, Doctor

Headers = dict[str, str]


def note(**overrides: Any) -> dict[str, Any]:
    body: dict[str, Any] = {
        "patient_name": "Jane Doe",
        "patient_dob": "1980-05-01",
        "notes": "Follow-up for type 2 diabetes.",
        "diagnosis_codes": ["E11.9"],
    }
    return body | overrides


def create(client: TestClient, headers: Headers, **overrides: Any) -> dict[str, Any]:
    response = client.post("/consultation", json=note(**overrides), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def list_notes(client: TestClient, headers: Headers, **params: str | int) -> dict[str, Any]:
    response = client.get("/consultation", params=params, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def names(page: dict[str, Any]) -> list[str]:
    return [item["patient_name"] for item in page["items"]]


@pytest.mark.parametrize(
    ("method", "path"),
    [("post", "/consultation"), ("get", "/consultation"), ("get", "/consultation/1")],
)
def test_requires_authentication(client: TestClient, method: str, path: str) -> None:
    response = client.request(method, path, json=note() if method == "post" else None)

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


# --- Create ---------------------------------------------------------------


def test_create_returns_the_saved_note(
    client: TestClient, auth_headers: Headers, doctor: Doctor
) -> None:
    body = create(
        client,
        auth_headers,
        patient_name="  Jane Doe ",
        notes="  Follow-up.  ",
        diagnosis_codes=[" i10", "e11.9"],
    )

    assert body["id"] > 0
    assert body["patient_name"] == "Jane Doe"
    assert body["patient_dob"] == "1980-05-01"
    assert body["notes"] == "Follow-up."
    assert body["doctor_id"] == doctor.id
    assert body["doctor_name"] == "Dr. Gregory House"
    assert [d["code"] for d in body["diagnoses"]] == ["E11.9", "I10"]
    assert body["diagnoses"][1]["description"] == "Essential (primary) hypertension"
    for field in ("consultation_date", "created_at"):
        assert body[field].endswith("Z")
        assert datetime.fromisoformat(body[field]).utcoffset() == timedelta(0)


def test_create_persists_the_note_and_links(
    client: TestClient, auth_headers: Headers, db: Session
) -> None:
    body = create(client, auth_headers, diagnosis_codes=["E11.9", "I10"])

    saved = db.get(Consultation, body["id"])
    assert saved is not None
    assert [d.code for d in saved.diagnoses] == ["E11.9", "I10"]


def test_create_accepts_a_missing_or_todays_dob(client: TestClient, auth_headers: Headers) -> None:
    assert create(client, auth_headers, patient_dob=None)["patient_dob"] is None
    today = date.today().isoformat()
    assert create(client, auth_headers, patient_dob=today)["patient_dob"] == today


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"patient_name": " J "}, "patient_name"),
        ({"patient_name": "x" * 101}, "patient_name"),
        ({"notes": "   "}, "notes"),
        ({"notes": "x" * 5001}, "notes"),
        ({"diagnosis_codes": []}, "diagnosis_codes"),
        ({"diagnosis_codes": [f"A{i:02d}" for i in range(21)]}, "diagnosis_codes"),
        ({"diagnosis_codes": ["E11.9", "e11.9"]}, "diagnosis_codes"),
        ({"diagnosis_codes": ["ZZZ.9"]}, "diagnosis_codes"),
        ({"diagnosis_codes": ["E11.12345"]}, "diagnosis_codes"),
        ({"patient_dob": (date.today() + timedelta(days=1)).isoformat()}, "patient_dob"),
        ({"patient_dob": "not-a-date"}, "patient_dob"),
    ],
)
def test_create_rejects_invalid_input(
    client: TestClient, auth_headers: Headers, overrides: dict[str, Any], field: str
) -> None:
    response = client.post("/consultation", json=note(**overrides), headers=auth_headers)

    assert response.status_code == 422
    assert field in {error["loc"][1] for error in response.json()["detail"]}


def test_create_reports_every_missing_field(client: TestClient, auth_headers: Headers) -> None:
    response = client.post("/consultation", json={}, headers=auth_headers)

    assert response.status_code == 422
    missing = {e["loc"][1] for e in response.json()["detail"] if e["type"] == "missing"}
    assert missing == {"patient_name", "notes", "diagnosis_codes"}


def test_create_rejects_unknown_codes_and_saves_nothing(
    client: TestClient, auth_headers: Headers, db: Session
) -> None:
    response = client.post(
        "/consultation",
        json=note(diagnosis_codes=["Z99.999", "E11.9", "A00.0"]),
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Unknown diagnosis code(s): A00.0, Z99.999"}
    assert db.scalar(select(func.count()).select_from(Consultation)) == 0


# --- List and get ---------------------------------------------------------


def test_list_is_empty_without_notes(client: TestClient, auth_headers: Headers) -> None:
    assert list_notes(client, auth_headers) == {"items": [], "total": 0}


def test_list_returns_newest_first_with_total(client: TestClient, auth_headers: Headers) -> None:
    for name in ("Anna", "Binh", "Chloe"):
        create(client, auth_headers, patient_name=name)

    page = list_notes(client, auth_headers)

    assert page["total"] == 3
    assert names(page) == ["Chloe", "Binh", "Anna"]


def test_list_paginates(client: TestClient, auth_headers: Headers) -> None:
    for name in ("Anna", "Binh", "Chloe", "Dung"):
        create(client, auth_headers, patient_name=name)

    page = list_notes(client, auth_headers, skip=1, limit=2)

    assert page["total"] == 4
    assert names(page) == ["Chloe", "Binh"]
    assert names(list_notes(client, auth_headers, skip=4)) == []


@pytest.mark.parametrize("params", [{"skip": -1}, {"limit": 0}, {"limit": 101}])
def test_list_rejects_invalid_pagination(
    client: TestClient, auth_headers: Headers, params: dict[str, int]
) -> None:
    response = client.get("/consultation", params=params, headers=auth_headers)

    assert response.status_code == 422


def test_list_shows_no_doctor_for_unattributed_notes(
    client: TestClient, auth_headers: Headers, db: Session
) -> None:
    db.add(
        Consultation(
            patient_name="Legacy Patient",
            notes="Recorded before login existed.",
            diagnoses=[db.get_one(DiagnosisCode, "I10")],
        )
    )
    db.commit()

    [item] = list_notes(client, auth_headers)["items"]

    assert item["doctor_id"] is None
    assert item["doctor_name"] is None


def test_get_returns_one_note(client: TestClient, auth_headers: Headers) -> None:
    created = create(client, auth_headers)

    response = client.get(f"/consultation/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == created


def test_get_returns_404_for_a_missing_note(client: TestClient, auth_headers: Headers) -> None:
    response = client.get("/consultation/999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Consultation not found"}


# --- Search -----------------------------------------------------------------


@pytest.fixture
def notes(client: TestClient, auth_headers: Headers) -> None:
    create(client, auth_headers, patient_name="John Smith", diagnosis_codes=["J06.9"])
    create(client, auth_headers, patient_name="Maria Garcia", diagnosis_codes=["E11.65", "I10"])
    create(client, auth_headers, patient_name="john appleseed", diagnosis_codes=["M54.50"])
    create(client, auth_headers, patient_name="Jane Doe", diagnosis_codes=["E11.9", "I10"])
    create(client, auth_headers, patient_name="100% Real_Name", diagnosis_codes=["R07.9"])


@pytest.mark.usefixtures("notes")
@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"patient": "john"}, ["john appleseed", "John Smith"]),
        ({"patient": "  JOHN S "}, ["John Smith"]),
        ({"patient": "%"}, ["100% Real_Name"]),
        ({"patient": "real_"}, ["100% Real_Name"]),
        ({"patient": "jo_n"}, []),
        ({"diagnosis": "E11"}, ["Jane Doe", "Maria Garcia"]),
        ({"diagnosis": " e11.9 "}, ["Jane Doe"]),
        ({"diagnosis": "I10"}, ["Jane Doe", "Maria Garcia"]),
        ({"diagnosis": "E1_"}, []),
        ({"patient": "maria", "diagnosis": "I10"}, ["Maria Garcia"]),
        ({"patient": "jane", "diagnosis": "J06"}, []),
        ({"patient": "nobody"}, []),
    ],
)
def test_search_by_patient_and_diagnosis(
    client: TestClient, auth_headers: Headers, params: dict[str, str], expected: list[str]
) -> None:
    page = list_notes(client, auth_headers, **params)

    assert names(page) == expected
    assert page["total"] == len(expected)


@pytest.mark.usefixtures("notes")
def test_search_results_keep_all_diagnoses_of_each_note(
    client: TestClient, auth_headers: Headers
) -> None:
    [item] = list_notes(client, auth_headers, patient="maria", diagnosis="I10")["items"]

    assert [d["code"] for d in item["diagnoses"]] == ["E11.65", "I10"]


@pytest.mark.usefixtures("notes")
def test_search_total_counts_all_matches_beyond_the_page(
    client: TestClient, auth_headers: Headers
) -> None:
    page = list_notes(client, auth_headers, diagnosis="I10", limit=1)

    assert page["total"] == 2
    assert names(page) == ["Jane Doe"]


@pytest.mark.parametrize(
    "params", [{"patient": "x" * 101}, {"diagnosis": "E" * 11}], ids=["patient", "diagnosis"]
)
def test_search_rejects_overlong_terms(
    client: TestClient, auth_headers: Headers, params: dict[str, str]
) -> None:
    response = client.get("/consultation", params=params, headers=auth_headers)

    assert response.status_code == 422
