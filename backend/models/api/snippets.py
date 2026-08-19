"""Small DRF fields for API-serialising snippet ForeignKeys inline.

Wagtail's default ForeignKey serialiser returns only ``{id, meta.type,
meta.detail_url}`` for related objects, which forces the frontend to make
a follow-up round-trip per relation. These fields inline the useful bits.
"""

from __future__ import annotations

from typing import Any

from rest_framework.fields import Field


class NamedSnippetField(Field):
    """Inline a snippet FK as ``{id, name, slug}``.

    Reads ``name`` (or falls back to ``title``), and ``slug`` if present.
    Suitable for simple taxonomy-like snippets (``Category``, ``Author``,
    ``Tag``).
    """

    def to_representation(self, value: Any) -> dict[str, Any] | None:
        if value is None:
            return None
        name = getattr(value, "name", None) or getattr(value, "title", None) or str(value)
        return {
            "id": value.pk,
            "name": name,
            "slug": getattr(value, "slug", None),
        }
