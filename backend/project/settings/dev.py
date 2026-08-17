"""Development settings."""

from .base import *  # noqa: F401,F403
from .base import INSTALLED_APPS, MIDDLEWARE, SITE_URL

DEBUG = True

# Insecure default; overridden by DJANGO_SECRET_KEY env in .env
SECRET_KEY = "django-insecure-dev-key-do-not-use-in-prod"  # noqa: S105

ALLOWED_HOSTS = ["*"]
CSRF_TRUSTED_ORIGINS = [SITE_URL, "http://localhost:8000", "http://127.0.0.1:8000"]

# Email to console during dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Django Debug Toolbar (optional, only loaded if installed)
try:
    import debug_toolbar  # type: ignore  # noqa: F401

    INSTALLED_APPS = [*INSTALLED_APPS, "debug_toolbar"]
    MIDDLEWARE = [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
        *MIDDLEWARE,
    ]
    INTERNAL_IPS = ["127.0.0.1"]
except ImportError:
    pass
