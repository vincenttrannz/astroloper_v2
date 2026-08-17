"""Wagtail API v2 router.

Exposes:
    /api/v2/pages/       - Page tree (headless read)
    /api/v2/images/      - Uploaded images
    /api/v2/documents/   - Uploaded documents
"""

from __future__ import annotations

from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)
api_router.register_endpoint("images", ImagesAPIViewSet)
api_router.register_endpoint("documents", DocumentsAPIViewSet)
