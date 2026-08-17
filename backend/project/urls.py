"""
Top-level URL configuration.

Traefik routes these path prefixes to the backend:
    /admin           - Wagtail admin
    /django-admin    - Django admin
    /api/v2          - Wagtail API v2 (headless)
    /media           - Uploaded media
    /static          - Collected static (also served by whitenoise)
Everything else is routed to the Next.js frontend.
"""

from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin as django_admin
from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

from project.api import api_router

urlpatterns = [
    path("django-admin/", django_admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    path("api/v2/", api_router.urls),
    # Wagtail's catch-all is kept for backend-served preview URLs only
    # (headless-preview redirects through it). It must come last.
    path("pages/", include(wagtail_urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    try:
        import debug_toolbar  # type: ignore

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls)), *urlpatterns]
    except ImportError:
        pass
