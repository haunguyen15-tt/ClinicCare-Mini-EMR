# The FastAPI backend. In docker-compose it is reachable only on the compose network:
# the Nuxt server is its only client (see frontend/server).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# A non-root user. data/ holds the SQLite file; it is created here so the named volume
# mounted over it starts out owned by that user.
RUN useradd --system --uid 10001 --no-create-home app \
    && mkdir -p /app/data \
    && chown app:app /app/data

COPY app ./app
COPY sql ./sql

USER app
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]

# DATABASE_URL defaults to sqlite:///./data/cliniccare.db, which resolves to /app/data.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
