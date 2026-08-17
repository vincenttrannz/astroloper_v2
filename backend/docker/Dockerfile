# syntax=docker/dockerfile:1.7

# -------------------------------------------------------------------------
# Production image for the Wagtail + Django backend.
# Multi-stage build:
#   1. `builder` - install deps into a venv with uv
#   2. `runtime` - copy the venv + source; run entrypoint.sh
# -------------------------------------------------------------------------

ARG PYTHON_VERSION=3.13

FROM python:${PYTHON_VERSION}-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --frozen 2>/dev/null || uv sync --no-dev

# ---------------------------------------------------------------

FROM python:${PYTHON_VERSION}-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=project.settings.production

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app . /app

RUN mkdir -p /app/media /app/static_collected \
    && chown -R app:app /app/media /app/static_collected \
    && chmod +x /app/docker/entrypoint.sh

USER app

EXPOSE 8000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["gunicorn", "project.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--access-logfile", "-", "--error-logfile", "-"]
