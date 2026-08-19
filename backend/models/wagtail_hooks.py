"""Wagtail admin hooks - register snippet viewsets, menu items, etc."""

from __future__ import annotations

from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet

from models.snippets.author import Author
from models.snippets.category import Category


class AuthorViewSet(SnippetViewSet):
    model = Author
    icon = "user"
    menu_label = "Authors"
    menu_order = 200
    list_display = ("name", "email")
    search_fields = ("name", "email")


class CategoryViewSet(SnippetViewSet):
    model = Category
    icon = "folder-open-inverse"
    menu_label = "Categories"
    menu_order = 215
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


register_snippet(AuthorViewSet)
register_snippet(CategoryViewSet)
