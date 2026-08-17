from django.apps import AppConfig


class ModelsConfig(AppConfig):
    """Single Django app that holds all content models.

    Named `models` intentionally - this is the umbrella package under which
    pages/, snippets/, settings/, mixins/, and streamfield/ live. See
    ``docs/ARCHITECTURE.md`` for why the app is named this way and how the
    ``models.py`` shim satisfies Django's ``<app>.models`` lookup.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "models"
    label = "models"
    verbose_name = "Content"
