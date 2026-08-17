"""Layout blocks - columns / grid structures."""

from __future__ import annotations

from wagtail import blocks

from models.streamfield.blocks import ImageBlock, QuoteBlock, RichTextBlock


class ColumnsBlock(blocks.StructBlock):
    columns = blocks.ChoiceBlock(
        choices=[("2", "Two"), ("3", "Three"), ("4", "Four")],
        default="2",
    )
    items = blocks.StreamBlock(
        [
            ("rich_text", RichTextBlock()),
            ("image", ImageBlock()),
            ("quote", QuoteBlock()),
        ],
        min_num=1,
    )

    class Meta:
        icon = "grip"
        label = "Columns"
