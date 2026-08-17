"""Wagtail admin hooks - register snippet viewsets, menu items, etc."""

from __future__ import annotations

from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet

from models.snippets.author import Author
from models.snippets.tag import Tag


class AuthorViewSet(SnippetViewSet):
    model = Author
    icon = "user"
    menu_label = "Authors"
    menu_order = 200
    list_display = ("name", "email")
    search_fields = ("name", "email")


class TagViewSet(SnippetViewSet):
    model = Tag
    icon = "tag"
    menu_label = "Tags"
    menu_order = 210
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


register_snippet(AuthorViewSet)
register_snippet(TagViewSet)
