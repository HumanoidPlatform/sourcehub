# =============================================================================
# One image, two commands. The api and worker services differ only in what they
# run, so they share a build — fewer images to keep in step, and the worker is
# guaranteed to hold the same code as the API that enqueued its tasks.
#
#   api     uvicorn sourcehub.main:app
#   worker  celery -A sourcehub.worker.celery_app worker -Q media,qa,notify
#
# Build context is the REPO ROOT, not backend/, so migrations and db/ are
# reachable:  docker build -f backend/Dockerfile .
# =============================================================================

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# ffmpeg and libGL are needed by the media queue (probe, transcode, thumbnails,
# the variance-of-Laplacian blur check). Kept in the base image so the worker
# does not need a separate one.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        ffmpeg \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# --- dependencies ------------------------------------------------------------
# Copied alone so a source change does not invalidate the dependency layer.
FROM base AS deps
COPY backend/pyproject.toml ./
RUN pip install --upgrade pip && pip install .


# --- development -------------------------------------------------------------
FROM deps AS dev
RUN pip install ".[dev]"
COPY backend/ /app/
COPY db/ /app/db/
ENV PYTHONPATH=/app/src
EXPOSE 8000
CMD ["uvicorn", "sourcehub.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# --- production --------------------------------------------------------------
FROM deps AS prod
COPY backend/src/ /app/src/
COPY backend/migrations/ /app/migrations/
COPY backend/alembic.ini /app/
ENV PYTHONPATH=/app/src

# Never run as root.
RUN useradd --create-home --uid 1000 sourcehub && chown -R sourcehub:sourcehub /app
USER sourcehub

EXPOSE 8000
CMD ["uvicorn", "sourcehub.main:app", "--host", "0.0.0.0", "--port", "8000"]
