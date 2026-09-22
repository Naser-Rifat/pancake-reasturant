from django.db import migrations, models


LEGACY_DEFAULTS = {
    "hero_lead": {
        "Warm pancake stacks, made to order in Geelong West and served for relaxed catch-ups with your favourite people.":
            "Warm pancake stacks, made to order and served for relaxed catch-ups with your favourite people.",
        "We pour our hearts into every stack, so you can enjoy Geelong’s best pancakes with the people you love.":
            "We pour our hearts into every stack, so you can enjoy fresh pancakes with the people you love.",
    },
    "about_points": {
        "Made to order on the griddle\nSweet and savoury choices\nDine in or order pickup\nFind us in Geelong West":
            "Made to order on the griddle\nSweet and savoury choices\nDine in or order pickup\nFreshly prepared for every guest",
    },
    "club_hero_kicker": {"The Pancake Club · Geelong West": "The Pancake Club"},
    "club_bento_3_badge": {"☕ Geelong West": "☕ Our local parlour"},
    "club_benefit_2_desc": {
        "Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for Geelong regulars.":
            "Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for local regulars.",
    },
    "footer_tagline": {"Fluffy stacks · made to order · Geelong West": "Fluffy stacks · made to order"},
    "marquee_words": {
        "Fluffy Stacks\nGeelong West\nSweet & Savoury\nMade to Order\nBrunch Together\nPickup Ready":
            "Fluffy Stacks\nSweet & Savoury\nMade to Order\nBrunch Together\nPickup Ready",
    },
    "about_text": {
        "G'day! The Pancake Club is a place for warm stacks, relaxed catch-ups, and good food in Geelong West.":
            "G'day! The Pancake Club is a place for warm stacks, relaxed catch-ups, and good food.",
    },
}


def replace_legacy_defaults(apps, schema_editor):
    SiteSettings = apps.get_model("core", "SiteSettings")
    Review = apps.get_model("core", "Review")
    Certification = apps.get_model("core", "Certification")
    Announcement = apps.get_model("core", "Announcement")

    for field, replacements in LEGACY_DEFAULTS.items():
        for old_value, new_value in replacements.items():
            SiteSettings.objects.filter(**{field: old_value}).update(**{field: new_value})

    review_updates = [
        ("Sarah M.", "Geelong West", "Best pancakes I've had in Geelong, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.", "Local diner", "The stack is cloud-fluffy and the warm maple butter is addictive."),
        ("Daniel K.", "Newtown", "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. Our new Geelong favourite!", "Nearby", "Booked online for a birthday brunch — the table was ready and the staff were lovely."),
        ("Tom B.", "East Geelong", "Took the kids on a weekend for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.", "Nearby", "Fast, friendly, and the banana caramel stack is dangerously good."),
        ("Jess W.", "Highton", "The Big Brekkie Stack lives up to its name. Loved the vibe on Pakington Street. We will definitely be back.", "Local diner", "The Big Brekkie Stack lives up to its name. We will definitely be back."),
    ]
    for name, suburb, quote, new_suburb, new_quote in review_updates:
        Review.objects.filter(name=name, suburb=suburb, quote=quote).update(
            suburb=new_suburb,
            quote=new_quote,
        )

    Certification.objects.filter(
        title="5-Star Hygiene Rating",
        subtitle="City of Greater Geelong",
    ).update(subtitle="Local council inspection")
    Certification.objects.filter(
        title="Best Pancakes — Geelong 2025",
        subtitle="Victorian Hospitality Awards",
    ).update(title="Guest Favourite", subtitle="Hospitality Awards")
    Announcement.objects.filter(
        details="This weekend only · Dine-in & Takeaway in Geelong",
    ).update(details="This weekend only · Dine-in & Takeaway")


class Migration(migrations.Migration):
    dependencies = [("core", "0039_alter_sitesettings_club_benefit_1_badge_and_more")]

    operations = [
        migrations.RunPython(replace_legacy_defaults, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sitesettings",
            name="hero_lead",
            field=models.TextField(default="Warm pancake stacks, made to order and served for relaxed catch-ups with your favourite people."),
        ),
        migrations.AlterField(
            model_name="sitesettings",
            name="about_points",
            field=models.TextField(blank=True, default="Made to order on the griddle\nSweet and savoury choices\nDine in or order pickup\nFreshly prepared for every guest", help_text="One tick per line. These are public claims — keep them true."),
        ),
        migrations.AlterField(model_name="sitesettings", name="club_hero_kicker", field=models.CharField(default="The Pancake Club", max_length=80)),
        migrations.AlterField(model_name="sitesettings", name="club_bento_3_badge", field=models.CharField(blank=True, default="☕ Our local parlour", max_length=60)),
        migrations.AlterField(
            model_name="sitesettings",
            name="club_benefit_2_desc",
            field=models.TextField(blank=True, default="Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for local regulars."),
        ),
        migrations.AlterField(model_name="sitesettings", name="footer_tagline", field=models.CharField(default="Fluffy stacks · made to order", help_text="Shown in the footer.", max_length=120)),
        migrations.AlterField(model_name="sitesettings", name="marquee_words", field=models.TextField(blank=True, default="Fluffy Stacks\nSweet & Savoury\nMade to Order\nBrunch Together\nPickup Ready", help_text="One phrase per line.")),
        migrations.AlterField(model_name="sitesettings", name="about_text", field=models.TextField(default="G'day! The Pancake Club is a place for warm stacks, relaxed catch-ups, and good food.")),
        migrations.AlterField(model_name="sitesettings", name="address", field=models.CharField(blank=True, default="", max_length=200)),
        migrations.AlterField(model_name="sitesettings", name="map_embed", field=models.CharField(blank=True, default="", max_length=500)),
    ]
