"""Seed the database with the storefront's current demo content. Idempotent."""
from datetime import time

from django.core.management.base import BaseCommand

from core.models import (
    Announcement,
    Certification,
    GalleryPhoto,
    MenuItem,
    OpeningHours,
    Review,
    SiteSettings,
)

MENU = [
    ("buttermilk", "Classic Buttermilk Stack", 14, "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.", "sweet", "none", 680, 14, "10–12 min", True),
    ("berry", "Berry Bliss", 17, "Blueberries and strawberries piled high with berry compote and vanilla cream.", "sweet", "none", 720, 15, "12–14 min", True),
    ("choc", "Choc Overload", 18, "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.", "choc", "hot", 890, 16, "12–14 min", True),
    ("banana", "Banana Caramel", 16, "Caramelised banana, salted caramel sauce and crushed roasted pecans.", "sweet", "none", 780, 13, "12–14 min", False),
    ("lemon", "Lemon Ricotta", 16, "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.", "sweet", "none", 640, 18, "12–15 min", False),
    ("brekkie", "Big Brekkie Stack", 19, "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.", "savoury", "medium", 840, 32, "14–16 min", False),
]

REVIEWS = [
    ("Sarah M.", "Surry Hills", 5, "Best pancakes I've had in Sydney, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.", "😀"),
    ("Daniel K.", "Parramatta", 5, "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. We'll be back!", "🎉"),
    ("Priya S.", "Newtown", 4, "Great vibe, colourful fit-out, quick service. The Lemon Ricotta is genuinely special — light as air and not too sweet.", "🌱"),
    ("Tom B.", "Manly", 5, "Took the kids on a Tuesday for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.", "👨‍👧"),
    ("Jess W.", "Bondi", 5, "The Big Brekkie Stack lives up to its name. Loved that they do gluten-free batter too — my partner was stoked.", "🔥"),
]

GALLERY = [
    ("food", "The Classic Buttermilk, fresh off the griddle", "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=700&q=70", "Classic buttermilk pancake stack"),
    ("food", "Berry Bliss — piled high", "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700&q=70", "Berry pancake stack"),
    ("interior", "Our main dining room", "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=700&q=70", "Restaurant interior"),
    ("food", "Honey drizzle in slow motion", "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=700&q=70", "Pancakes with honey drizzle"),
    ("events", "Birthday night at KRUSH", "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=700&q=70", "Friends celebrating at dinner"),
    ("interior", "Window seats for people-watching", "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=700&q=70", "Cosy dining space"),
    ("food", "Banana Caramel, salted-caramel heaven", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=700&q=70", "Banana caramel pancakes"),
    ("food", "Weekend special — cinnamon swirls", "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=700&q=70", "Cinnamon scrolls dusted with sugar"),
    ("interior", "The bar, ready for service", "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=70", "Restaurant bar area"),
    ("food", "Choc Overload — no regrets", "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=700&q=70", "Chocolate pancakes"),
    ("events", "Family dinners done right", "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=700&q=70", "Family dining event"),
    ("interior", "Warm lights, warmer welcomes", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=70", "Restaurant seating area"),
    ("food", "The full brekkie spread", "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=700&q=70", "Breakfast pancake spread"),
    ("events", "Date night, sorted", "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=700&q=70", "Dinner table for two"),
    ("food", "Lemon Ricotta under a snowfall of sugar", "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=700&q=70", "Lemon ricotta pancakes"),
    ("interior", "Room for the whole crew", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=70", "Large dining area"),
]

CERTS = [
    ("🛡️", "Food Safety Certified", "NSW Food Authority"),
    ("⭐", "5-Star Hygiene Rating", "Local Council Inspection"),
    ("🏆", "Best Pancakes — Sydney 2025", "Local Eats Awards"),
    ("✅", "HACCP Compliant", "Certified Kitchen"),
    ("🌱", "Local Produce Partner", "NSW Farmers' Network"),
]

HOURS = [
    ("Monday – Thursday", time(11, 0), time(21, 0)),
    ("Friday – Saturday", time(11, 0), time(23, 0)),
    ("Sunday", time(11, 0), time(20, 0)),
    ("Public Holidays", time(12, 0), time(20, 0)),
]


class Command(BaseCommand):
    help = "Seed demo content matching the Next.js storefront (safe to re-run)."

    def handle(self, *args, **options):
        for i, (slug, name, price, desc, tag, heat, kcal, protein, prep, featured) in enumerate(MENU):
            MenuItem.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    name=name, price=price, description=desc, tag=tag, heat=heat,
                    kcal=kcal, protein_g=protein, prep_time=prep,
                    image=f"/menu/{slug}.png", is_featured=featured, sort_order=i,
                ),
            )

        for name, suburb, rating, quote, avatar in REVIEWS:
            Review.objects.update_or_create(
                name=name, suburb=suburb,
                defaults=dict(rating=rating, quote=quote, avatar=avatar, is_approved=True),
            )

        for i, (album, caption, image, alt) in enumerate(GALLERY):
            GalleryPhoto.objects.update_or_create(
                image=image,
                defaults=dict(album=album, caption=caption, alt=alt, sort_order=i),
            )

        for i, (label, opens, closes) in enumerate(HOURS):
            OpeningHours.objects.update_or_create(
                label=label, defaults=dict(opens=opens, closes=closes, sort_order=i)
            )

        for i, (icon, title, subtitle) in enumerate(CERTS):
            Certification.objects.update_or_create(
                title=title, defaults=dict(icon=icon, subtitle=subtitle, sort_order=i)
            )

        SiteSettings.load()  # create the singleton with its defaults

        Announcement.objects.update_or_create(
            message="🎉 Tuesday Special — 2-for-1 Classic Buttermilk Stack all day!",
            defaults=dict(link_text="Book your table", link_url="/booking", is_active=True),
        )

        self.stdout.write(self.style.SUCCESS("Demo content seeded."))
