from django.db import migrations

# The exact copy and images that were hard-coded in app/(site)/page.tsx, moved
# into the database so the page looks identical the moment it reads from here.
STEPS = [
    ("Step 1", "Order online",
     "Pick your stacks on the menu — pay nothing until you collect.",
     "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=75"),
    ("Step 2", "We griddle fresh",
     "Your order hits the griddle the moment it lands — never before.",
     "https://images.unsplash.com/photo-1590137876181-2a5a7e340308?w=800&q=75"),
    ("Step 3", "Pick up hot",
     "Ready in about 15 minutes. Grab it warm and get stuck in.",
     "https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=800&q=75"),
]

ABOUT_IMAGES = [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=75",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75",
    "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=75",
]


def seed(apps, schema_editor):
    HomeStep = apps.get_model("core", "HomeStep")
    SiteSettings = apps.get_model("core", "SiteSettings")

    if not HomeStep.objects.exists():
        for i, (label, title, text, image) in enumerate(STEPS):
            HomeStep.objects.create(
                label=label, title=title, text=text, image=image, sort_order=i
            )

    site = SiteSettings.objects.filter(pk=1).first()
    if site and not site.about_image_1:
        site.about_image_1, site.about_image_2, site.about_image_3 = ABOUT_IMAGES
        site.save(update_fields=["about_image_1", "about_image_2", "about_image_3"])


def unseed(apps, schema_editor):
    apps.get_model("core", "HomeStep").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0014_homestep_sitesettings_about_heading_and_more")]
    operations = [migrations.RunPython(seed, unseed)]
