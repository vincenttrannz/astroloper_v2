"""ContactSubmission snippet - persisted rows for every contact form POST.

Read-only in the admin: editors can browse who wrote in, but shouldn't
edit or delete submissions. The frontend never reads this - it's only
for the site owner's inbox.
"""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel

from models.mixins.timestamped import TimestampedMixin


class ContactSubmission(TimestampedMixin, models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=280, blank=True)
    message = models.TextField()

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("name", read_only=True),
                FieldPanel("email", read_only=True),
                FieldPanel("subject", read_only=True),
            ],
            heading="From",
        ),
        FieldPanel("message", read_only=True),
    ]

    class Meta:
        app_label = "models"
        ordering = ["-created_at"]
        verbose_name = "Contact submission"

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>: {self.subject or '(no subject)'}"
