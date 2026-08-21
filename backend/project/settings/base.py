"""
Base Django settings shared by every environment.

Environment-specific overrides live alongside this file
(`dev.py`, `staging.py`, `production.py`) and are selected via the
DJANGO_SETTINGS_MODULE environment variable.
"""

from __future__ import annotations

from pathlib import Path

import environ

# -------------------------------------------------------------------------
# Paths + environment
# -------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_DIR = BASE_DIR / "project"

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_SECRET_KEY=(str, "django-insecure-change-me"),
    SITE_HOST=(str, "astroloper.localhost"),
    SITE_URL=(str, "https://astroloper.localhost"),
    WAGTAILADMIN_BASE_URL=(str, "https://astroloper.localhost"),
    DATABASE_URL=(str, "postgres://astroloper:astroloper@db:5432/astroloper"),
    REDIS_URL=(str, "redis://redis:6379/0"),
    AGENT_URL=(str, ""),
    AGENT_API_KEY=(str, ""),
    CONTACT_TO_EMAIL=(str, "hello@astroloper.localhost"),
    DEFAULT_FROM_EMAIL=(str, "no-reply@astroloper.localhost"),
    EMAIL_HOST=(str, "mailpit"),
    EMAIL_PORT=(int, 1025),
    EMAIL_USE_TLS=(bool, False),
    EMAIL_USE_SSL=(bool, False),
    EMAIL_HOST_USER=(str, ""),
    EMAIL_HOST_PASSWORD=(str, ""),
)

# Read .env if present (dev convenience; ignored when compose provides env).
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

# -------------------------------------------------------------------------
# Core
# -------------------------------------------------------------------------

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
SITE_HOST = env("SITE_HOST")
SITE_URL = env("SITE_URL")

ALLOWED_HOSTS = [SITE_HOST, "backend", "localhost", "127.0.0.1"]

# When Traefik terminates TLS in front of us, Django needs to know so
# `request.is_secure()` and generated absolute URLs use https://.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
CSRF_TRUSTED_ORIGINS = [SITE_URL]

WSGI_APPLICATION = "project.wsgi.application"
ASGI_APPLICATION = "project.asgi.application"
ROOT_URLCONF = "project.urls"

# -------------------------------------------------------------------------
# Installed apps
# -------------------------------------------------------------------------

INSTALLED_APPS = [
    # Local
    "models",
    # Wagtail
    "wagtail.contrib.forms",
    "wagtail.contrib.redirects",
    "wagtail.contrib.settings",
    "wagtail.embeds",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail.api.v2",
    "wagtail",
    "wagtail_headless_preview",
    # Third-party
    "modelcluster",
    "taggit",
    "corsheaders",
    "rest_framework",
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "wagtail.contrib.redirects.middleware.RedirectMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -------------------------------------------------------------------------
# Database + cache
# -------------------------------------------------------------------------

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["ATOMIC_REQUESTS"] = True

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# -------------------------------------------------------------------------
# Password validation
# -------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -------------------------------------------------------------------------
# Internationalization
# -------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# -------------------------------------------------------------------------
# Static + media
# -------------------------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static_collected"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -------------------------------------------------------------------------
# Wagtail
# -------------------------------------------------------------------------

WAGTAIL_SITE_NAME = "Astroloper"
WAGTAILADMIN_BASE_URL = env("WAGTAILADMIN_BASE_URL")
WAGTAILDOCS_EXTENSIONS = ["csv", "docx", "key", "odt", "pdf", "pptx", "rtf", "txt", "xlsx", "zip"]
WAGTAILAPI_LIMIT_MAX = 100

# Headless preview - the frontend's preview route.
# REDIRECT_ON_PREVIEW=True is recommended for Wagtail 7.1+ (enables scroll
# restoration, userbar and the accessibility checker on the headless frontend).
WAGTAIL_HEADLESS_PREVIEW = {
    "CLIENT_URLS": {"default": f"{SITE_URL}/api/preview"},
    "SERVE_BASE_URL": None,
    "REDIRECT_ON_PREVIEW": True,
    "ENFORCE_TRAILING_SLASH": False,
}

# Search
WAGTAILSEARCH_BACKENDS = {
    "default": {
        "BACKEND": "wagtail.search.backends.database",
    }
}

# @TODO django-treebeard's E001 check (introduced in treebeard PR #400) fires against
# Wagtail's own PageManager / CollectionManager because they are composed via
# `Manager.from_queryset(...)`. At runtime the resulting classes *do* subclass
# MP_NodeManager, but the check inspects direct bases and doesn't see it.
# This is an upstream Wagtail issue to be fixed before Treebeard 6 makes it fatal.
SILENCED_SYSTEM_CHECKS = ["treebeard.E001"]

# -------------------------------------------------------------------------
# Contact form + AI agent chat proxy
# -------------------------------------------------------------------------

AGENT_URL = env("AGENT_URL")
AGENT_API_KEY = env("AGENT_API_KEY")
CONTACT_TO_EMAIL = env("CONTACT_TO_EMAIL")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL")

# SMTP transport. Dev compose points these at the Mailpit container;
# staging/prod override via Ansible-managed env vars to hit a real
# relay (e.g. Resend on smtp.resend.com:587 + STARTTLS).
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = env("EMAIL_PORT")
EMAIL_USE_TLS = env("EMAIL_USE_TLS")
EMAIL_USE_SSL = env("EMAIL_USE_SSL")
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")

# -------------------------------------------------------------------------
# CORS (frontend runs on same origin behind Traefik, but keep open in dev)
# -------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = [SITE_URL]
CORS_ALLOW_CREDENTIALS = True

# -------------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "[{asctime}] {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
