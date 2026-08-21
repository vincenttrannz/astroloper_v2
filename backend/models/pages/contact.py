"""ContactPage - the site's contact page, served at ``/contact/``.

Content is a mix of editable fields (title, subtitle, contact intro
paragraph, contact email, terminal filename, agent greeting). The
terminal form + optional AI agent chat are rendered entirely by the
frontend using these fields.
"""

from __future__ import annotations

from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.fields import RichTextField
from wagtail.models import Page
from wagtail_headless_preview.models import HeadlessPreviewMixin

from models.mixins.seo import SEOMixin


class ContactPage(HeadlessPreviewMixin, SEOMixin, Page):
    """Editable contact page.

    ``body_intro`` (from ``SEOMixin``) is used as the subtitle under the
    page title ("Have an interesting project or a position you'd like to
    discuss? Let's talk.").
    """

    contact_email = models.EmailField(
        blank=True,
        help_text="Public email address shown in the sidebar (used for the mailto: link).",
    )
    contact_intro = models.TextField(
        blank=True,
        help_text=(
            "Short paragraph shown above the email in the Contact details "
            "column (e.g. \"Feel free to reach out directly via email...\")."
        ),
    )
    terminal_filename = models.CharField(
        max_length=60,
        blank=True,
        default="contact.sh",
        help_text="Title displayed in the terminal window chrome.",
    )
    agent_greeting = RichTextField(
        blank=True,
        help_text=(
            "First line printed by the assistant when the visitor types "
            "'chat' in the terminal. Leave blank to skip a greeting."
        ),
    )

    content_panels = Page.content_panels + [
        FieldPanel("body_intro"),
        MultiFieldPanel(
            [FieldPanel("contact_intro"), FieldPanel("contact_email")],
            heading="Contact details",
        ),
        MultiFieldPanel(
            [FieldPanel("terminal_filename"), FieldPanel("agent_greeting")],
            heading="Terminal",
        ),
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel(SEOMixin.seo_panels, heading="Social & SEO"),
    ]

    api_fields = [
        *SEOMixin.api_fields,
        APIField("contact_intro"),
        APIField("contact_email"),
        APIField("terminal_filename"),
        APIField("agent_greeting"),
    ]

    parent_page_types = ["models.HomePage"]
    subpage_types: list[str] = []
    max_count = 1

    class Meta:
        app_label = "models"
        verbose_name = "Contact page"
