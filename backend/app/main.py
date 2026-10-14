from fastapi import FastAPI

from app.api.routes import health


def create_app() -> FastAPI:
    app = FastAPI(
        title="ClinicCare Mini EMR API",
        version="0.1.0",
        description="Search ICD-10 codes and manage consultation notes.",
    )
    app.include_router(health.router)
    return app


app = create_app()
