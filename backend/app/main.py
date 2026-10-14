import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import get_current_doctor
from app.api.routes import auth, consultation, diagnosis, health
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.db.init_db import init_db
from app.db.session import engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if "jwt_secret" not in settings.model_fields_set:
        logger.warning("JWT_SECRET is not set: using a random secret, tokens end on restart")
    init_db(engine)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Search ICD-10 codes and manage consultation notes.",
        lifespan=lifespan,
    )

    # Registered before CORS so CORS ends up outermost and also wraps error responses.
    register_error_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    # Every feature router below requires a logged-in doctor.
    protected = [Depends(get_current_doctor)]
    app.include_router(diagnosis.router, dependencies=protected)
    app.include_router(consultation.router, dependencies=protected)
    return app


app = create_app()
