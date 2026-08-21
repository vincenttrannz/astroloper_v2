from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("models", "0008_contactsubmission_contactpage"),
    ]

    operations = [
        migrations.RenameField(
            model_name="contactpage",
            old_name="hermes_greeting",
            new_name="agent_greeting",
        ),
    ]
