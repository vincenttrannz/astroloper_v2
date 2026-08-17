"""Staging settings - like production but slightly noisier logging."""

from .production import *  # noqa: F401,F403
from .production import LOGGING

LOGGING["root"]["level"] = "DEBUG"
LOGGING["loggers"]["django"]["level"] = "DEBUG"
