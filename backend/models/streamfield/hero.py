"""Hero block - big top-of-page visual with a headline and CTA."""

from __future__ import annotations

from wagtail import blocks

from models.api.images import APIImageChooserBlock


class HeroBlock(blocks.StructBlock):
    heading = blocks.CharBlock(required=True, max_length=120)
    subheading = blocks.CharBlock(required=False, max_length=200)
    image = APIImageChooserBlock(required=False)
    cta_label = blocks.CharBlock(required=False, max_length=40)
    cta_url = blocks.URLBlock(required=False)
    align = blocks.ChoiceBlock(
        choices=[("left", "Left"), ("center", "Center"), ("right", "Right")],
        default="left",
        required=True,
    )

    class Meta:
        icon = "pick"
        label = "Hero"
