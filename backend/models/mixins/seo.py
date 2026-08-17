"""Reusable SEO fields for any Wagtail Page.

Wagtail's built-in ``Page`` model already has ``seo_title`` and
``search_description``. This mixin layers on OpenGraph/Twitter card fields
so social sharing renders nicely without hard-coding it into every Page
subclass.
"""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField

from models.api.images import ImageRenditionsField


class SEOMixin(models.Model):
    og_title = models.CharField(
        "OpenGraph title",
        max_length=255,
        blank=True,
        help_text="Overrides seo_title on social cards. Leave blank to reuse seo_title.",
    )
    og_description = models.TextField(
        "OpenGraph description",
        blank=True,
        help_text="Overrides search_description on social cards.",
    )
    og_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Social sharing image",
    )
    canonical_url = models.URLField(
        blank=True,
        help_text="Optional canonical URL for pages syndicated from elsewhere.",
    )
    body_intro = RichTextField(
        blank=True,
        help_text="Short intro rendered above main content and used as fallback description.",
    )

    seo_panels = [
        MultiFieldPanel(
            [
                FieldPanel("og_title"),
                FieldPanel("og_description"),
                FieldPanel("og_image"),
                FieldPanel("canonical_url"),
            ],
            heading="Social & SEO",
        ),
    ]

    api_fields = [
        APIField("og_title"),
        APIField("og_description"),
        APIField("og_image", serializer=ImageRenditionsField()),
        APIField("canonical_url"),
        APIField("body_intro"),
    ]

    class Meta:
        abstract = True
