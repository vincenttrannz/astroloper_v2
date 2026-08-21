"""``/api/v2/site-chrome/`` -- global data every page in the frontend needs.

Returns the ``SiteSettings``, ``MainMenu`` and ``FooterMenu`` for the current
Site in a single JSON payload so the Next.js RootLayout can fetch chrome
data once per request (or with ISR, once per revalidation window).
"""

from __future__ import annotations

from typing import Any

from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET
from wagtail.models import Site


def _serialize_menu_items(menu) -> list[dict[str, Any]]:
    """StreamField of MenuLinkBlock -> list of {label, url, open_in_new_tab}."""
    if menu is None:
        return []
    items: list[dict[str, Any]] = []
    for entry in menu.items:
        value = entry.value  # StructValue for MenuLinkBlock
        page = value.get("page")
        url = value.get("url") or (page.get_url() if page else None)
        items.append(
            {
                "id": str(entry.id),
                "label": value.get("label"),
                "url": url,
                "open_in_new_tab": bool(value.get("open_in_new_tab")),
            }
        )
    return items


def _serialize_settings(settings) -> dict[str, Any] | None:
    if settings is None:
        return None
    # Local import to avoid a circular import at module load time.
    from models.api.images import serialize_image

    return {
        "tagline": settings.tagline,
        "footer_text": settings.footer_text,
        "logo": serialize_image(settings.logo),
        "favicon": serialize_image(settings.favicon),
        "twitter_url": settings.twitter_url,
        "facebook_url": settings.facebook_url,
        "github_url": settings.github_url,
        "linkedin_url": settings.linkedin_url,
    }


@require_GET
def site_chrome_view(request: HttpRequest) -> JsonResponse:
    from models.settings.menus import FooterMenu, MainMenu
    from models.settings.site import SiteSettings

    site = Site.find_for_request(request) or Site.objects.filter(is_default_site=True).first()
    if site is None:
        return JsonResponse({"detail": "No Wagtail Site configured."}, status=404)

    return JsonResponse(
        {
            "settings": _serialize_settings(SiteSettings.for_site(site)),
            "main_menu": {"items": _serialize_menu_items(MainMenu.for_site(site))},
            "footer_menu": {"items": _serialize_menu_items(FooterMenu.for_site(site))},
        }
    )
