"""Wagtail admin hooks - register snippet viewsets, menu items, etc."""

from __future__ import annotations

from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet

from models.snippets.author import Author
from models.snippets.category import Category
from models.snippets.contact_submission import ContactSubmission


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


class ContactSubmissionViewSet(SnippetViewSet):
    model = ContactSubmission
    icon = "mail"
    menu_label = "Contact submissions"
    menu_order = 300
    list_display = ("name", "email", "subject", "created_at")
    search_fields = ("name", "email", "subject", "message")
    add_to_admin_menu = True


register_snippet(AuthorViewSet)
register_snippet(CategoryViewSet)
register_snippet(ContactSubmissionViewSet)
