"""``TimestampedMixin`` - created_at / updated_at for non-Page models.

Wagtail's Page model already carries ``first_published_at`` and
``last_published_at``. Use this on snippets and other non-Page models
where you want automatic timestamps.
"""

from __future__ import annotations

from django.db import models


class TimestampedMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True
