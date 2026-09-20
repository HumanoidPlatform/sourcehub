# =============================================================================
# The API.
#
#   docker build -f backend/Dockerfile --target prod -t <repo>:api-<sha> .
#
# Build context is the REPO ROOT, not backend/, so migrations and db/ are
# reachable. The root .dockerignore decides what that context may contain —
# read it before adding a COPY here.
#
# There is no worker stage. Celery is a declared dependency and the compose
# file used to name `sourcehub.worker.celery_app`, but that package does not
# exist: nothing defines a task and nothing enqueues one. The image no longer
# carries ffmpeg, libGL and a C toolchain (~400 MB) for a queue that is not
# there. When the media worker is written, it needs them back and a stage of
# its own.
# =============================================================================

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app


# --- dependencies ------------------------------------------------------------
# The dependency list is read OUT of pyproject.toml rather than installing the
# project itself. Two reasons:
#
#   1. `pip install .` cannot work with pyproject.toml alone — hatchling is
#      configured with packages = ["src/sourcehub"] and fails when that tree is
#      absent. Copying the source in to satisfy it would put application code in
#      the dependency layer, and every one-line change would then reinstall
#      every package.
#   2. pyproject.toml stays the single place dependencies are declared. No
#      requirements.txt to drift out of step with it.
#
# So this layer rebuilds only when pyproject.toml changes. tomllib is in the
# standard library from 3.11, so nothing is needed to read it.
FROM base AS deps
COPY backend/pyproject.toml ./
RUN python -c "import tomllib;print('\n'.join(tomllib.load(open('pyproject.toml','rb'))['project']['dependencies']))" > /tmp/requirements.txt \
    && pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt


# --- development -------------------------------------------------------------
# Unused by the deployment; kept because compose's commented-out api service
# refers to it. Hot reload, tests and db/*.sql present.
FROM deps AS dev
COPY backend/ /app/
COPY db/ /app/db/
# After the source, not before: the dev extras are declared in pyproject and
# hatchling needs src/sourcehub on disk to resolve the project at all.
RUN pip install -e ".[dev]"
ENV PYTHONPATH=/app/src
EXPOSE 8000
CMD ["uvicorn", "sourcehub.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# --- production --------------------------------------------------------------
FROM deps AS prod

# Source last: it changes every build, and nothing below it is cacheable.
COPY backend/src/ /app/src/
COPY backend/migrations/ /app/migrations/
COPY backend/alembic.ini /app/

# The package is imported from /app/src rather than installed. `alembic upgrade
# head` therefore works from /app, which is what the deploy script runs.
ENV PYTHONPATH=/app/src

# Which build this is. Passed by the release script as the git commit, so a
# running container can always be traced back to a revision:
#   docker inspect --format '{{.Config.Labels}}' <image>
ARG BUILD_VERSION=dev
ENV BUILD_VERSION=$BUILD_VERSION
LABEL org.opencontainers.image.title="DataMind360 API" \
      org.opencontainers.image.version="$BUILD_VERSION" \
      org.opencontainers.image.source="https://github.com/HumanoidPlatform/sourcehub"

# Never as root. A stray path traversal then cannot write outside /home.
RUN useradd --create-home --uid 1000 sourcehub && chown -R sourcehub:sourcehub /app
USER sourcehub

EXPOSE 8000

# Docker restarts an unhealthy container and the deploy script waits on this,
# so a deploy that half-works fails visibly instead of quietly serving errors.
# urllib rather than curl: the slim image has no curl and adding one to check
# your own liveness is not worth a layer.
#
# /health only says the process is up. Once GET /ready exists (it opens a
# database connection), point this at that instead — "healthy" should mean the
# database answers, not merely that uvicorn accepted a socket.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import sys,urllib.request;sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=4).status==200 else 1)"

# Two workers: enough for UAT, and the reason DB_POOL_SIZE must stay small —
# each worker opens its own pool, and the VM's Postgres allows 100 connections
# in total, shared with whatever a developer's laptop is holding open.
#
# --proxy-headers so the address recorded against a sign-in attempt is the
# visitor's, not nginx's. Trusting every forwarded address is safe only because
# this container publishes no port: nginx on the same Docker network is the one
# thing that can reach it. Publish 8000 and that assumption is gone.
CMD ["uvicorn", "sourcehub.main:app", \
     "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "2", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
