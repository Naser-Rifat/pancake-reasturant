from django.db import migrations


def deactivate_legacy_sydney_demo_content(apps, schema_editor):
    """Hide the original Sydney demo records without touching staff content."""
    Review = apps.get_model("core", "Review")
    Certification = apps.get_model("core", "Certification")
    Announcement = apps.get_model("core", "Announcement")

    demo_reviews = [
        (
            "Sarah M.",
            "Surry Hills",
            "Best pancakes I've had in Sydney, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.",
        ),
        (
            "Daniel K.",
            "Parramatta",
            "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. We'll be back!",
        ),
        (
            "Tom B.",
            "Manly",
            "Took the kids on a Tuesday for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.",
        ),
        (
            "Jess W.",
            "Bondi",
            "The Big Brekkie Stack lives up to its name. Loved that they do gluten-free batter too — my partner was stoked.",
        ),
    ]
    for name, suburb, quote in demo_reviews:
        Review.objects.filter(name=name, suburb=suburb, quote=quote).update(
            is_approved=False
        )

    Certification.objects.filter(
        title="Best Pancakes — Sydney 2025", subtitle="Local Eats Awards"
    ).update(is_active=False)

    demo_campaigns = [
        "🥞 Weekend Brunch Pass — 20% Off All Stacks Before 11am!",
        "🎉 Tuesday Special — 2-for-1 Classic Buttermilk Stack all day!",
        "KIDS EAT FREE EVERY SUNDAY WITH A FULL-PRICE STACK",
    ]
    Announcement.objects.filter(message__in=demo_campaigns).update(is_active=False)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0037_alter_sitesettings_abn_and_more"),
    ]

    operations = [
        migrations.RunPython(
            deactivate_legacy_sydney_demo_content,
            migrations.RunPython.noop,
        ),
    ]
