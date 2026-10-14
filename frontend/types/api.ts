// Mirrors the Pydantic schemas in backend/app/schemas. Dates travel as ISO strings:
// `YYYY-MM-DD` for dates, and UTC timestamps ending in `Z` for datetimes.

export interface Diagnosis {
  code: string
  description: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Doctor {
  id: number
  username: string
  full_name: string
}

export interface ConsultationCreate {
  patient_name: string
  patient_dob?: string | null
  notes: string
  diagnosis_codes: string[]
}

export interface Consultation {
  id: number
  patient_name: string
  patient_dob: string | null
  notes: string
  consultation_date: string
  doctor_id: number | null
  // Null for notes created before authentication existed.
  doctor_name: string | null
  created_at: string
  diagnoses: Diagnosis[]
}

export interface ConsultationList {
  items: Consultation[]
  total: number
}

export interface ConsultationQuery {
  skip?: number
  limit?: number
  patient?: string
  diagnosis?: string
}

export interface DiagnosisQuery {
  search?: string
  limit?: number
}

// Every backend error body is `{"detail": ...}`; 422 responses carry a list instead of a string.
export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ApiErrorBody {
  detail: string | ValidationErrorItem[]
}
