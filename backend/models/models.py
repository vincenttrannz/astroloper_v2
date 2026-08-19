"""Django ``<app>.models`` discovery shim.

Django auto-loads model classes from ``<app>.models``. Because this app is
literally called ``models``, that lookup path is ``models.models`` - this
file. It exists solely to re-export every *concrete* Django model class
defined in the sub-packages so ``django.apps.get_models()`` can find them.

Rule: add one import line here whenever you introduce a new concrete model.
Abstract mixins in ``models/mixins/`` do NOT belong here (they have
``Meta.abstract = True`` and Django ignores them for migrations).
"""

from models.pages.blog import BlogIndexPage, BlogPage
from models.pages.home import HomePage
from models.pages.project import (
    ProjectIndexPage,
    ProjectPage,
    ProjectPageKeyFeature,
    ProjectPageTechnology,
)
from models.settings.menus import FooterMenu, MainMenu
from models.settings.site import SiteSettings
from models.snippets.author import Author
from models.snippets.category import Category
from models.snippets.tag import Tag

__all__ = [
    "Author",
    "BlogIndexPage",
    "BlogPage",
    "Category",
    "FooterMenu",
    "HomePage",
    "MainMenu",
    "ProjectIndexPage",
    "ProjectPage",
    "ProjectPageKeyFeature",
    "ProjectPageTechnology",
    "SiteSettings",
    "Tag",
]
