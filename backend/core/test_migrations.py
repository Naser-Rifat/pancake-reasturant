from importlib import import_module

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class RemoveLocationSpecificDefaultsMigrationTests(TransactionTestCase):
    migrate_from = [("core", "0039_alter_sitesettings_club_benefit_1_badge_and_more")]
    migrate_to = [("core", "0040_remove_location_specific_defaults")]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        old_apps = executor.loader.project_state(self.migrate_from).apps
        SiteSettings = old_apps.get_model("core", "SiteSettings")

        migration = import_module("core.migrations.0040_remove_location_specific_defaults")
        legacy_values = {
            field: next(iter(replacements))
            for field, replacements in migration.LEGACY_DEFAULTS.items()
        }
        self.managed_id = SiteSettings.objects.create(
            address="42 Example Road, Sampletown NSW 2000, Australia",
            **legacy_values,
        ).pk
        self.custom_id = SiteSettings.objects.create(
            footer_tagline="A staff-authored footer",
            address="7 Custom Lane, Stafftown QLD 4000, Australia",
        ).pk

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        self.apps = executor.loader.project_state(self.migrate_to).apps

    def tearDown(self):
        MigrationExecutor(connection).migrate(
            MigrationExecutor(connection).loader.graph.leaf_nodes()
        )
        super().tearDown()

    def test_replaces_only_legacy_defaults_and_preserves_addresses(self):
        migration = import_module("core.migrations.0040_remove_location_specific_defaults")
        SiteSettings = self.apps.get_model("core", "SiteSettings")
        managed = SiteSettings.objects.get(pk=self.managed_id)

        for field, replacements in migration.LEGACY_DEFAULTS.items():
            self.assertEqual(getattr(managed, field), next(iter(replacements.values())))
        self.assertEqual(
            managed.address,
            "42 Example Road, Sampletown NSW 2000, Australia",
        )

        custom = SiteSettings.objects.get(pk=self.custom_id)
        self.assertEqual(custom.footer_tagline, "A staff-authored footer")
        self.assertEqual(
            custom.address,
            "7 Custom Lane, Stafftown QLD 4000, Australia",
        )
