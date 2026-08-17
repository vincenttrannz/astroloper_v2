"""Tag snippet - shared taxonomy for blog posts and other content."""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField


class Tag(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(blank=True)

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("description"),
    ]

    api_fields = [
        APIField("name"),
        APIField("slug"),
        APIField("description"),
    ]

    class Meta:
        app_label = "models"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
