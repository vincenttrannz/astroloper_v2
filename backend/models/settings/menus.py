"""Main and footer menus - editable, ordered link lists.

Both are simple ``BaseSiteSetting`` subclasses so they live under
"Settings" in the Wagtail admin. Menu items are stored as StreamField
entries so authors can mix internal page links with external URLs.
"""

from __future__ import annotations

from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.fields import StreamField


class MenuLinkBlock(blocks.StructBlock):
    label = blocks.CharBlock(required=True, max_length=60)
    page = blocks.PageChooserBlock(required=False)
    url = blocks.URLBlock(required=False, help_text="Overrides page link if set.")
    open_in_new_tab = blocks.BooleanBlock(required=False, default=False)

    class Meta:
        icon = "link"
        label = "Link"


menu_blocks: list[tuple[str, blocks.Block]] = [("link", MenuLinkBlock())]


@register_setting(icon="list-ul")
class MainMenu(BaseSiteSetting):
    items = StreamField(menu_blocks, blank=True, use_json_field=True)

    panels = [FieldPanel("items")]
    api_fields = [APIField("items")]

    class Meta:
        app_label = "models"
        verbose_name = "Main menu"


@register_setting(icon="list-ol")
class FooterMenu(BaseSiteSetting):
    items = StreamField(menu_blocks, blank=True, use_json_field=True)

    panels = [FieldPanel("items")]
    api_fields = [APIField("items")]

    class Meta:
        app_label = "models"
        verbose_name = "Footer menu"
