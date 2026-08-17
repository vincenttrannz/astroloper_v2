"""HomePage - the site root, served at ``/`` by the frontend."""

from __future__ import annotations

from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.mixins.seo import SEOMixin
from models.streamfield import HeroBlock, content_blocks


class HomePage(HeadlessPreviewMixin, SEOMixin, Page):
    hero = StreamField(
        [("hero", HeroBlock())],
        blank=True,
        max_num=1,
        use_json_field=True,
    )
    body = StreamField(content_blocks, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel("body_intro"),
        FieldPanel("hero"),
        FieldPanel("body"),
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel(SEOMixin.seo_panels, heading="Social & SEO"),
    ]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("hero"),
        APIField("body"),
    ]

    parent_page_types: list[str] = ["wagtailcore.Page"]
    subpage_types: list[str] = ["models.BlogIndexPage"]

    class Meta:
        app_label = "models"
        verbose_name = "Home page"
