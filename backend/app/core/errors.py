"""Domain exceptions and the handlers that turn every error into ``{"detail": ...}``."""

import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base class for errors that map to a specific HTTP status."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


async def app_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def validation_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    # Keep location, message and type only: the raw input may contain sensitive values.
    errors = [
        {"loc": list(err.get("loc", ())), "msg": err.get("msg", ""), "type": err.get("type", "")}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": jsonable_encoder(errors)},
    )


async def catch_unhandled_errors(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    # Runs as middleware rather than an Exception handler so the 500 response still
    # passes through CORSMiddleware and the browser can read it.
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.middleware("http")(catch_unhandled_errors)
