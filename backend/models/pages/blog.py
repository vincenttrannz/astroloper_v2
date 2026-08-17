"""Blog page types - index + detail."""

from __future__ import annotations

from django.db import models
from modelcluster.fields import ParentalManyToManyField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page
from wagtail.search import index
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.mixins.seo import SEOMixin
from models.streamfield import ColumnsBlock, HeroBlock, content_blocks


class BlogIndexPage(HeadlessPreviewMixin, SEOMixin, Page):
    intro = StreamField(
        [("rich_text", content_blocks[0][1])],
        blank=True,
        use_json_field=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("body_intro"),
        FieldPanel("intro"),
    ]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("intro"),
    ]

    parent_page_types = ["models.HomePage"]
    subpage_types = ["models.BlogPage"]

    class Meta:
        app_label = "models"
        verbose_name = "Blog index"


class BlogPage(HeadlessPreviewMixin, SEOMixin, Page):
    date = models.DateField("Post date")
    author = models.ForeignKey(
        "models.Author",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    tags = ParentalManyToManyField("models.Tag", blank=True, related_name="+")
    hero = StreamField(
        [("hero", HeroBlock())],
        blank=True,
        max_num=1,
        use_json_field=True,
    )
    body = StreamField(
        [*content_blocks, ("columns", ColumnsBlock())],
        blank=True,
        use_json_field=True,
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [FieldPanel("date"), FieldPanel("author"), FieldPanel("tags")],
            heading="Metadata",
        ),
        FieldPanel("body_intro"),
        FieldPanel("hero"),
        FieldPanel("body"),
    ]

    search_fields = Page.search_fields + [
        index.SearchField("body"),
        index.FilterField("date"),
    ]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("date"),
        APIField("author"),
        APIField("tags"),
        APIField("hero"),
        APIField("body"),
    ]

    parent_page_types = ["models.BlogIndexPage"]
    subpage_types: list[str] = []

    class Meta:
        app_label = "models"
        verbose_name = "Blog post"
