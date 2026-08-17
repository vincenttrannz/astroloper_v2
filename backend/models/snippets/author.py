"""Author snippet - shareable byline used by blog posts and articles."""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField

from models.mixins.timestamped import TimestampedMixin


class Author(TimestampedMixin, models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    email = models.EmailField(blank=True)
    bio = RichTextField(blank=True)
    avatar = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("email"),
        FieldPanel("avatar"),
        FieldPanel("bio"),
    ]

    api_fields = [
        APIField("name"),
        APIField("slug"),
        APIField("email"),
        APIField("bio"),
        APIField("avatar"),
    ]

    class Meta:
        app_label = "models"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
