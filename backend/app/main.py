from fastapi import FastAPI

from app.api.routes import health
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Search ICD-10 codes and manage consultation notes.",
    )
    app.include_router(health.router)
    return app


app = create_app()
