"""Blog page types - index + detail."""

from __future__ import annotations

from django.db import models
from django.utils.html import strip_tags
from modelcluster.contrib.taggit import ClusterTaggableManager
from modelcluster.fields import ParentalKey
from taggit.models import TaggedItemBase
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Page
from wagtail.search import index
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.api.snippets import NamedSnippetField
from models.mixins.seo import SEOMixin
from models.streamfield import ColumnsBlock, RichTextBlock, content_blocks

WORDS_PER_MINUTE = 200


class BlogPageTag(TaggedItemBase):
    """Through-model connecting BlogPages to taggit ``Tag`` rows.

    Using ``TaggedItemBase`` (from django-taggit) gives us the idiomatic
    Wagtail tag input in the admin: a comma-separated text field with
    autocomplete off existing tags.
    """

    content_object = ParentalKey(
        "BlogPage",
        on_delete=models.CASCADE,
        related_name="tagged_items",
    )

    class Meta:
        app_label = "models"


class BlogIndexPage(HeadlessPreviewMixin, SEOMixin, Page):
    """Blog listing.

    Title + ``body_intro`` (subtitle) come from ``Page`` + ``SEOMixin``.
    Child ``BlogPage`` records are pulled via the API v2 pages endpoint
    (``child_of=<this-id>&type=models.BlogPage``) - no dedicated field
    needed here.
    """

    # Optional additional intro shown between the subtitle and the posts grid.
    # Constrained to rich_text only so it stays a lightweight editorial lede.
    intro = StreamField(
        [("rich_text", RichTextBlock())],
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
    max_count = 1

    class Meta:
        app_label = "models"
        verbose_name = "Blog index"


class BlogPage(HeadlessPreviewMixin, SEOMixin, Page):
    category = models.ForeignKey(
        "models.Category",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Primary category (shown as the emerald label above the title).",
    )
    date = models.DateField("Post date")
    author = models.ForeignKey(
        "models.Author",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    tags = ClusterTaggableManager(through=BlogPageTag, blank=True)
    body = StreamField(
        [*content_blocks, ("columns", ColumnsBlock())],
        blank=True,
        use_json_field=True,
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("category"),
                FieldPanel("date"),
                FieldPanel("author"),
                FieldPanel("tags"),
            ],
            heading="Metadata",
        ),
        FieldPanel("body_intro"),
        FieldPanel("body"),
    ]

    search_fields = Page.search_fields + [
        index.SearchField("body"),
        index.FilterField("date"),
    ]

    # ---- Derived API fields ----

    @property
    def tag_names(self) -> list[str]:
        """Tag names as a plain list of strings, ready to render as pills."""
        return list(self.tags.order_by("name").values_list("name", flat=True))

    @property
    def excerpt(self) -> str:
        """Plain-text summary drawn from ``body_intro``, capped at 280 chars."""
        return strip_tags(self.body_intro or "").strip()[:280]

    @property
    def reading_time(self) -> int:
        """Best-effort reading time in minutes (200 wpm).

        Walks ``body_intro`` plus the StreamField's raw JSON so the number
        stays roughly right as new block types are added, without needing
        each one to opt in explicitly.
        """
        parts: list[str] = [self.body_intro or ""]
        for entry in self.body.raw_data or []:
            _collect_strings(entry.get("value"), parts)
        text = strip_tags(" ".join(parts))
        return max(1, round(len(text.split()) / WORDS_PER_MINUTE))

    api_fields = [
        *SEOMixin.api_fields,
        APIField("category", serializer=NamedSnippetField()),
        APIField("date"),
        APIField("author", serializer=NamedSnippetField()),
        APIField("tag_names"),
        APIField("body"),
        APIField("excerpt"),
        APIField("reading_time"),
    ]

    parent_page_types = ["models.BlogIndexPage"]
    subpage_types: list[str] = []

    class Meta:
        app_label = "models"
        verbose_name = "Blog post"


def _collect_strings(value, out: list[str]) -> None:
    """Recursively harvest string leaves from a StreamField raw-JSON value."""
    if isinstance(value, str):
        out.append(value)
    elif isinstance(value, dict):
        for v in value.values():
            _collect_strings(v, out)
    elif isinstance(value, list):
        for v in value:
            _collect_strings(v, out)
