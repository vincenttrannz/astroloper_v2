"""Site-wide settings editable from the Wagtail admin."""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting


@register_setting(icon="cog")
class SiteSettings(BaseSiteSetting):
    """Global settings that appear once per Site in the Wagtail admin."""

    tagline = models.CharField(
        max_length=200,
        blank=True,
        help_text="Short tagline shown in the header and used in default OG descriptions.",
    )
    footer_text = models.TextField(
        blank=True,
        help_text="Copyright / colophon shown in the footer.",
    )
    logo = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    favicon = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    twitter_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)

    panels = [
        MultiFieldPanel(
            [FieldPanel("tagline"), FieldPanel("footer_text")],
            heading="Copy",
        ),
        MultiFieldPanel(
            [FieldPanel("logo"), FieldPanel("favicon")],
            heading="Branding",
        ),
        MultiFieldPanel(
            [
                FieldPanel("twitter_url"),
                FieldPanel("github_url"),
                FieldPanel("linkedin_url"),
            ],
            heading="Social links",
        ),
    ]

    api_fields = [
        APIField("tagline"),
        APIField("footer_text"),
        APIField("logo"),
        APIField("favicon"),
        APIField("twitter_url"),
        APIField("github_url"),
        APIField("linkedin_url"),
    ]

    class Meta:
        app_label = "models"
        verbose_name = "Site settings"
