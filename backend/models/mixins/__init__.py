"""Abstract model mixins used across pages / snippets.

Everything here is ``Meta.abstract = True`` and doesn't create tables.
"""

from models.mixins.seo import SEOMixin
from models.mixins.timestamped import TimestampedMixin

__all__ = ["SEOMixin", "TimestampedMixin"]
