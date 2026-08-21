"""Replace ``ContactPage.response_time_note`` with ``contact_intro``.

``response_time_note`` was a fixed CharField(280) meant for a single line
under the contact email. The redesign uses a full short paragraph
instead - keep the existing seeded text by copying it into the new
``contact_intro`` TextField before dropping the old column.
"""

from django.db import migrations, models


def copy_response_time_note_forward(apps, schema_editor):
    ContactPage = apps.get_model("models", "ContactPage")
    for page in ContactPage.objects.all():
        if not page.contact_intro and page.response_time_note:
            page.contact_intro = page.response_time_note
            page.save(update_fields=["contact_intro"])


def copy_contact_intro_back(apps, schema_editor):
    """Best-effort reverse migration - only preserves up to 280 chars."""
    ContactPage = apps.get_model("models", "ContactPage")
    for page in ContactPage.objects.all():
        if not page.response_time_note and page.contact_intro:
            page.response_time_note = page.contact_intro[:280]
            page.save(update_fields=["response_time_note"])


class Migration(migrations.Migration):
    dependencies = [
        ("models", "0009_rename_contactpage_hermes_greeting"),
    ]

    operations = [
        migrations.AddField(
            model_name="contactpage",
            name="contact_intro",
            field=models.TextField(
                blank=True,
                help_text=(
                    "Short paragraph shown above the email in the Contact "
                    "details column (e.g. \"Feel free to reach out directly "
                    "via email...\")."
                ),
            ),
        ),
        migrations.RunPython(
            copy_response_time_note_forward,
            copy_contact_intro_back,
        ),
        migrations.RemoveField(
            model_name="contactpage",
            name="response_time_note",
        ),
    ]
