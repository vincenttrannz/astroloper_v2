"""API serialization helpers for Wagtail images.

By default the Wagtail API v2 emits image references as bare integer pks, which
forces the headless frontend to make a follow-up round-trip per image (and
another one per rendition). This module provides a small "image -> JSON with
pre-computed renditions" layer that can be reused from:

- :class:`APIImageChooserBlock` -- drop-in replacement for
  ``wagtail.images.blocks.ImageChooserBlock`` inside StreamField blocks.
- :class:`ImageRenditionsField` -- a DRF field for use with
  ``APIField("og_image", serializer=ImageRenditionsField())`` on Page/Snippet
  ForeignKeys to :model:`wagtailimages.Image`.

Adjust :data:`IMAGE_RENDITION_SPECS` to tune which renditions are generated.
Each value is a Wagtail image filter spec -- see
https://docs.wagtail.org/en/stable/topics/images.html#image-filters
"""

from __future__ import annotations

from typing import Any

from rest_framework.fields import Field
from wagtail.images.blocks import ImageChooserBlock
from wagtail.images.models import AbstractImage

IMAGE_RENDITION_SPECS: dict[str, str] = {
    "thumbnail": "fill-400x300",
    "card": "fill-800x450",
    "medium": "max-1200x1200",
    "large": "max-2000x2000",
}


def serialize_image(
    image: AbstractImage | None,
    rendition_specs: dict[str, str] | None = None,
) -> dict[str, Any] | None:
    """Serialize an Image to a dict with pre-computed renditions.

    Returns ``None`` when ``image`` is falsy so callers can pass through
    optional / nullable image fields directly.
    """
    if image is None:
        return None

    specs = rendition_specs or IMAGE_RENDITION_SPECS
    # get_renditions is batched: it creates any missing renditions and returns
    # a {spec: Rendition} dict in one DB round-trip.
    renditions = image.get_renditions(*specs.values())

    return {
        "id": image.pk,
        "title": image.title,
        "alt": image.default_alt_text or image.title,
        "width": image.width,
        "height": image.height,
        "renditions": {
            name: {
                "url": renditions[spec].full_url,
                "width": renditions[spec].width,
                "height": renditions[spec].height,
            }
            for name, spec in specs.items()
        },
    }


class APIImageChooserBlock(ImageChooserBlock):
    """Like ``ImageChooserBlock`` but serialises the whole image (with
    renditions) to the API v2 output instead of the bare pk.
    """

    def get_api_representation(self, value, context=None):  # noqa: ARG002
        return serialize_image(value)


class ImageRenditionsField(Field):
    """DRF field for use with ``APIField(..., serializer=ImageRenditionsField())``.

    Serialises an :model:`wagtailimages.Image` ForeignKey (or any Image
    instance) using :func:`serialize_image`.
    """

    def to_representation(self, value):
        return serialize_image(value)
