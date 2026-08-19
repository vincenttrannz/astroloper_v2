"""Callout block - highlighted note / takeaway box."""

from __future__ import annotations

from wagtail import blocks


class CalloutBlock(blocks.StructBlock):
    label = blocks.CharBlock(
        required=True,
        max_length=60,
        default="Key Takeaway",
        help_text="Bold label at the top of the callout.",
    )
    body = blocks.TextBlock(required=True)
    variant = blocks.ChoiceBlock(
        choices=[
            ("success", "Success (green)"),
            ("info", "Info (blue)"),
            ("warning", "Warning (amber)"),
        ],
        default="success",
    )

    class Meta:
        icon = "warning"
        label = "Callout"
