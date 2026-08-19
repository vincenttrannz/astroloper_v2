"""Category snippet - single-select taxonomy for pages (distinct from Tag)."""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(blank=True)

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("description"),
    ]

    api_fields = [
        APIField("id"),
        APIField("name"),
        APIField("slug"),
        APIField("description"),
    ]

    class Meta:
        app_label = "models"
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name
