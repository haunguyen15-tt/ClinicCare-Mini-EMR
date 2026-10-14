from pydantic import BaseModel, ConfigDict


class DiagnosisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    description: str
