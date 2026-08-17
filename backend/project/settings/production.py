"""Production settings."""

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")

# Security headers - safe defaults, tighten to taste.
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days; bump once you're confident
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False
