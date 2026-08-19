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
from project.site_chrome import site_chrome_view

urlpatterns = [
    path("django-admin/", django_admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # Custom endpoint must be declared before the API v2 router so it wins
    # over any accidentally-matching endpoint name.
    path("api/v2/site-chrome/", site_chrome_view, name="site-chrome"),
    path("api/v2/", api_router.urls),
    # Wagtail's serve view mounted at root so ``page.get_url()`` produces
    # clean URLs (``/blog/``, not ``/pages/blog/``). In headless mode real
    # user traffic is routed to Next.js by Traefik; this catch-all is only
    # reached by ``wagtail-headless-preview`` redirects. Must come last.
    path("", include(wagtail_urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    try:
        import debug_toolbar  # type: ignore

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls)), *urlpatterns]
    except ImportError:
        pass
