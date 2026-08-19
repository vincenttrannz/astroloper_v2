"""HomePage - the site root, served at ``/`` by the frontend.

Content is organised as **structured sections** rather than a free-form
StreamField so the frontend can render a specific portfolio layout (hero,
about, featured projects, recent posts). A minimal free-form ``body``
StreamField is kept for occasional additional content.
"""

from __future__ import annotations

from typing import Any

from django.db import models
from django.utils.html import strip_tags
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField, StreamField
from wagtail.models import Page
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.mixins.seo import SEOMixin
from models.pages.project import ProjectPage, _project_card_payload
from models.streamfield import content_blocks


class HomePage(HeadlessPreviewMixin, SEOMixin, Page):
    # --- Hero section ------------------------------------------------------
    availability_label = models.CharField(
        max_length=80,
        blank=True,
        help_text="Small tag above the hero heading (e.g. 'AVAILABLE FOR NEW PROJECTS').",
    )
    hero_heading = models.CharField(max_length=200, blank=True)
    hero_intro = models.TextField(blank=True)
    hero_cta_label = models.CharField(max_length=60, blank=True)
    hero_cta_url = models.URLField(blank=True)
    hero_code = models.TextField(
        blank=True,
        help_text="Optional code snippet displayed in the terminal card next to the hero.",
    )

    # --- About section -----------------------------------------------------
    about_heading = models.CharField(max_length=200, blank=True, default="About Me")
    about_body = RichTextField(blank=True)

    # --- Featured projects section ----------------------------------------
    projects_heading = models.CharField(max_length=200, blank=True, default="Featured Projects")
    featured_limit = models.PositiveSmallIntegerField(
        default=3,
        help_text=(
            "Maximum number of featured projects shown on the homepage. "
            "Populated from Project pages with 'Featured' turned on, in tree order."
        ),
    )

    # --- Blog feed section ------------------------------------------------
    blog_heading = models.CharField(max_length=200, blank=True, default="Recent Blog Posts")
    blog_limit = models.PositiveSmallIntegerField(
        default=3,
        help_text="How many recent blog posts to feature.",
    )

    # --- Optional additional content --------------------------------------
    body = StreamField(content_blocks, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("availability_label"),
                FieldPanel("hero_heading"),
                FieldPanel("hero_intro"),
                FieldPanel("hero_cta_label"),
                FieldPanel("hero_cta_url"),
                FieldPanel("hero_code"),
            ],
            heading="Hero",
        ),
        MultiFieldPanel(
            [FieldPanel("about_heading"), FieldPanel("about_body")],
            heading="About",
        ),
        MultiFieldPanel(
            [
                FieldPanel("projects_heading"),
                FieldPanel("featured_limit"),
            ],
            heading="Featured projects",
        ),
        MultiFieldPanel(
            [FieldPanel("blog_heading"), FieldPanel("blog_limit")],
            heading="Blog feed",
        ),
        MultiFieldPanel(
            [FieldPanel("body_intro"), FieldPanel("body")],
            heading="Additional content",
        ),
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel(SEOMixin.seo_panels, heading="Social & SEO"),
    ]

    # ---- Derived API fields ---------------------------------------------

    @property
    def featured_projects(self) -> list[dict[str, Any]]:
        """Serialised list of published ProjectPages flagged as ``featured``.

        Order follows the Wagtail page tree (``path``), which editors can
        control via 'Sort menu order' in the admin.
        """
        projects = (
            ProjectPage.objects.live()
            .public()
            .filter(featured=True)
            .select_related("hero_image")
            .order_by("path")[: (self.featured_limit or 3)]
        )
        return [_project_card_payload(p) for p in projects]

    @property
    def recent_posts(self) -> list[dict[str, Any]]:
        """A small card-shaped payload of the N most recent BlogPages."""
        from models.pages.blog import BlogPage

        posts = (
            BlogPage.objects.live()
            .public()
            .order_by("-first_published_at")[: (self.blog_limit or 3)]
        )
        return [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "url": p.get_url(),
                "first_published_at": p.first_published_at.isoformat() if p.first_published_at else None,
                "excerpt": strip_tags(p.body_intro or "").strip()[:280],
            }
            for p in posts
        ]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("availability_label"),
        APIField("hero_heading"),
        APIField("hero_intro"),
        APIField("hero_cta_label"),
        APIField("hero_cta_url"),
        APIField("hero_code"),
        APIField("about_heading"),
        APIField("about_body"),
        APIField("projects_heading"),
        APIField("featured_limit"),
        APIField("blog_heading"),
        APIField("featured_projects"),
        APIField("recent_posts"),
        APIField("body"),
    ]

    parent_page_types: list[str] = ["wagtailcore.Page"]
    subpage_types: list[str] = ["models.BlogIndexPage", "models.ProjectIndexPage"]

    class Meta:
        app_label = "models"
        verbose_name = "Home page"
