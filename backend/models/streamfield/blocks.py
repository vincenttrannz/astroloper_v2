"""Simple StreamField blocks used across pages."""

from __future__ import annotations

from wagtail import blocks

from models.api.images import APIImageChooserBlock


class RichTextBlock(blocks.RichTextBlock):
    """RichText block used everywhere. Rendered by Next.js from the API v2 output."""

    class Meta:
        icon = "doc-full"


class ImageBlock(blocks.StructBlock):
    image = APIImageChooserBlock(required=True)
    caption = blocks.CharBlock(required=False)
    alt_text = blocks.CharBlock(required=False)

    class Meta:
        icon = "image"


class QuoteBlock(blocks.StructBlock):
    quote = blocks.TextBlock(required=True)
    attribution = blocks.CharBlock(required=False)

    class Meta:
        icon = "openquote"


# Reusable "body content" set. Import this into pages that want a shared
# set of blocks, then extend/override per page as needed.
content_blocks: list[tuple[str, blocks.Block]] = [
    ("rich_text", RichTextBlock()),
    ("image", ImageBlock()),
    ("quote", QuoteBlock()),
]
