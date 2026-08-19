"""Project pages - index (grid of projects) + detail (case-study layout).

Projects live in the Wagtail page tree (``/projects/`` and
``/projects/<slug>/``) rather than as snippets so each project gets a real
URL, previewable admin, and full Wagtail SEO. The homepage's "Featured
projects" strip references these pages via an ordered through-model on
``HomePage``.
"""

from __future__ import annotations

from typing import Any

from django.db import models
from django.utils.html import strip_tags
from modelcluster.fields import ParentalKey
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import StreamField
from wagtail.models import Orderable, Page
from wagtail.search import index
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.api.images import ImageRenditionsField, serialize_image
from models.mixins.seo import SEOMixin
from models.streamfield import RichTextBlock


class ProjectIndexPage(HeadlessPreviewMixin, SEOMixin, Page):
    """Listing page for ProjectPages.

    Title + ``body_intro`` (from ``SEOMixin``) render the header. Child
    ``ProjectPage`` records are fetched via the API v2 pages endpoint
    (``child_of=<this-id>&type=models.ProjectPage``) - no dedicated field
    needed here.
    """

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
    subpage_types = ["models.ProjectPage"]
    max_count = 1

    class Meta:
        app_label = "models"
        verbose_name = "Project index"


class ProjectPage(HeadlessPreviewMixin, SEOMixin, Page):
    """A single project / case study."""

    featured = models.BooleanField(
        default=False,
        help_text="Show this project in the 'Featured Projects' strip on the homepage.",
    )
    role = models.CharField(
        max_length=120,
        blank=True,
        help_text="Your role on this project, e.g. 'Sole Creator' or 'Lead Engineer'.",
    )
    completed_label = models.CharField(
        max_length=60,
        blank=True,
        help_text="Free-form completion label, e.g. 'Q3 2024' or 'In progress'.",
    )
    tech_stack = models.JSONField(
        default=list,
        blank=True,
        help_text='Tech pills shown under the title. Example: ["Go", "gRPC", "Raft"]',
    )
    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    project_url = models.URLField(
        blank=True,
        help_text="Live site URL (renders the 'View Live Site' CTA).",
    )
    source_url = models.URLField(
        blank=True,
        help_text="Repository URL (renders the 'View Source Code' CTA).",
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("featured"),
                FieldPanel("role"),
                FieldPanel("completed_label"),
                FieldPanel("tech_stack"),
            ],
            heading="Metadata",
        ),
        FieldPanel("hero_image"),
        FieldPanel("body_intro"),
        MultiFieldPanel(
            [FieldPanel("project_url"), FieldPanel("source_url")],
            heading="External links",
        ),
        InlinePanel("key_features", label="Key feature"),
        InlinePanel("technologies", label="Technology"),
    ]

    search_fields = Page.search_fields + [
        index.SearchField("body_intro"),
        index.SearchField("role"),
        index.FilterField("featured"),
    ]

    # ---- Derived API fields ----

    @property
    def card_description(self) -> str:
        """Plain-text summary drawn from ``body_intro``, capped at 220 chars."""
        return strip_tags(self.body_intro or "").strip()[:220]

    @property
    def key_features_list(self) -> list[dict[str, Any]]:
        return [
            {"title": entry.title, "description": entry.description}
            for entry in self.key_features.all().order_by("sort_order")
        ]

    @property
    def technologies_list(self) -> list[dict[str, Any]]:
        return [
            {"name": entry.name, "description": entry.description}
            for entry in self.technologies.all().order_by("sort_order")
        ]

    @property
    def other_projects(self) -> list[dict[str, Any]]:
        """Sibling ProjectPages, excluding self, for the 'Other projects' strip."""
        qs = (
            ProjectPage.objects.live()
            .public()
            .sibling_of(self)
            .exclude(pk=self.pk)
            .order_by("-first_published_at")[:3]
        )
        return [_project_card_payload(p) for p in qs]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("featured"),
        APIField("role"),
        APIField("completed_label"),
        APIField("tech_stack"),
        APIField("hero_image", serializer=ImageRenditionsField()),
        APIField("project_url"),
        APIField("source_url"),
        APIField("card_description"),
        APIField("key_features_list"),
        APIField("technologies_list"),
        APIField("other_projects"),
    ]

    parent_page_types = ["models.ProjectIndexPage"]
    subpage_types: list[str] = []

    class Meta:
        app_label = "models"
        verbose_name = "Project"


class ProjectPageKeyFeature(Orderable):
    """A single 'Key feature' entry on a ProjectPage (title + short blurb)."""

    page = ParentalKey(
        ProjectPage,
        on_delete=models.CASCADE,
        related_name="key_features",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()

    panels = [FieldPanel("title"), FieldPanel("description")]

    class Meta(Orderable.Meta):
        app_label = "models"


class ProjectPageTechnology(Orderable):
    """A single 'Technology used' entry on a ProjectPage (name + short blurb)."""

    page = ParentalKey(
        ProjectPage,
        on_delete=models.CASCADE,
        related_name="technologies",
    )
    name = models.CharField(max_length=120)
    description = models.TextField()

    panels = [FieldPanel("name"), FieldPanel("description")]

    class Meta(Orderable.Meta):
        app_label = "models"


def _project_card_payload(project: ProjectPage) -> dict[str, Any]:
    """Shared 'project card' shape for `other_projects` and homepage featured."""
    return {
        "id": project.pk,
        "title": project.title,
        "slug": project.slug,
        "url": project.get_url(),
        "description": project.card_description,
        "image": serialize_image(project.hero_image),
        "tech_stack": project.tech_stack or [],
    }
