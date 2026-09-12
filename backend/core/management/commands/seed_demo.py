"""Seed the database with the storefront's current demo content. Idempotent."""
from datetime import time

from django.core.management.base import BaseCommand
import os
from django.contrib.auth import get_user_model
from core.models import Category
from core.models import (
    Announcement,
    Certification,
    GalleryPhoto,
    MenuItem,
    OpeningHours,
    Review,
    SiteSettings,
)


CATEGORIES = [
    ("Sweet Favourites", "sweet-favourites", "🍯", 1),
    ("Chocolate Blasts", "chocolate-blasts", "🍫", 2),
    ("Savoury Creations", "savoury-creations", "🥑", 3),
    ("Drinks & Ice Creams", "drinks-ice-creams", "🍨", 4),
    ("Brunch", "brunch", "🥞", 5),
    ("Dinner", "dinner", "🍽️", 6),
    ("Coffee", "coffee", "☕", 7),
    ("Kids", "kids", "🧒", 8),
]

MENU = [
    ("buttermilk", "Classic Buttermilk Stack", 14, "Four fluffy buttermilk pancakes with pure maple syrup and whipped butter.", "sweet-favourites", "none", 680, 14, "10–12 min", True),
    ("berry", "Berry Bliss", 17, "Blueberries and strawberries piled high with berry compote and vanilla cream.", "sweet-favourites", "none", 720, 15, "12–14 min", True),
    ("choc", "Choc Overload", 18, "Chocolate pancakes, hazelnut spread, brownie bits and a warm chocolate drizzle.", "chocolate-blasts", "hot", 890, 16, "12–14 min", True),
    ("banana", "Banana Caramel", 16, "Caramelised banana, salted caramel sauce and crushed roasted pecans.", "sweet-favourites", "none", 780, 13, "12–14 min", False),
    ("lemon", "Lemon Ricotta", 16, "Cloud-light ricotta pancakes with lemon curd and a snowfall of icing sugar.", "sweet-favourites", "none", 640, 18, "12–15 min", False),
    ("brekkie", "Big Brekkie Stack", 19, "Savoury stack with crispy bacon, fried eggs and maple butter. Sweet meets salty.", "savoury-creations", "medium", 840, 32, "14–16 min", False),
    ("iced-shake", "Artisan Milkshake & Thickshakes", 9, "Hand-spun gelato milkshakes with double whipped cream and waffle crunch.", "drinks-ice-creams", "none", 480, 8, "5–7 min", False),
    ("cold-juice", "Cold Pressed Sunshine Juice", 7.5, "Freshly squeezed Valencia oranges, crushed strawberries, and Valencia mint.", "drinks-ice-creams", "none", 160, 2, "3–5 min", False),
    ("avo-brunch", "Avocado & Poached Eggs Brunch", 18.5, "Smashed Hass avocado, two golden free-range poached eggs, crumbled feta & dukkah on toasted sourdough.", "brunch", "none", 590, 19, "10–12 min", False),
    ("maple-chicken", "Crispy Maple Fried Chicken Stack", 21, "Crispy golden buttermilk fried chicken tenders layered between fluffy stacks with spiced maple butter.", "dinner", "medium", 960, 38, "14–16 min", False),
    ("espresso-brew", "Specialty Flat White & Batch Brew", 5, "Double-shot Victorian roasted specialty espresso with silky textured milk.", "coffee", "none", 140, 6, "3–5 min", False),
    ("kids-mini-stack", "Little Stackers Mini Pancakes", 10, "Three palm-sized fluffy pancakes, pure maple drizzle, fresh strawberries, and vanilla ice cream.", "kids", "none", 390, 8, "7–9 min", False),
]

REVIEWS = [
    ("Sarah M.", "Geelong West", 5, "Best pancakes I've had in Geelong, hands down. The stack is cloud-fluffy and the warm maple butter is addictive.", "😀"),
    ("Daniel K.", "Newtown", 5, "Booked online for a birthday brunch — table was ready on the dot, staff were lovely, and the Choc Overload is a monster. Our new Geelong favourite!", "🎉"),
    ("Priya S.", "Belmont", 4, "Great vibe, colourful fit-out, quick service. The Lemon Ricotta is genuinely special — light as air and not too sweet.", "🌱"),
    ("Tom B.", "East Geelong", 5, "Took the kids on a weekend for the special. Fast, friendly, and the banana caramel stack is dangerously good. Our new family regular.", "👨‍👧"),
    ("Jess W.", "Highton", 5, "The Big Brekkie Stack lives up to its name. Loved the vibe on Pakington Street. We will definitely be back.", "🔥"),
]

GALLERY = [
    ("food", "The Classic Buttermilk, fresh off the griddle", "https://images.unsplash.com/photo-1575853121743-60c24f0a7502?w=700&q=70", "Classic buttermilk pancake stack"),
    ("food", "Berry Bliss — piled high", "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700&q=70", "Berry pancake stack"),
    ("interior", "Our main dining room", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=700&q=70", "Bright cafe dining room"),
    ("food", "Honey drizzle in slow motion", "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=700&q=70", "Pancakes with honey drizzle"),
    ("events", "Sunday brunch club", "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=700&q=70", "Brunch table spread with waffles and juice"),
    ("interior", "Window seats for people-watching", "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=700&q=70", "Sunny window table with coffee"),
    ("food", "Banana Caramel, salted-caramel heaven", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=700&q=70", "Banana caramel pancakes"),
    ("food", "Weekend special — cinnamon swirls", "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=700&q=70", "Cinnamon scrolls dusted with sugar"),
    ("interior", "The brew bar, ready for service", "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&q=70", "Pour-over coffee being brewed"),
    ("food", "Choc Overload — no regrets", "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=700&q=70", "Chocolate pancakes"),
    ("events", "Birthday parties welcome", "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&q=70", "Pastel party balloons"),
    ("interior", "Sunny seats out the front", "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=700&q=70", "Street-side cafe tables with flowers"),
    ("food", "The full brekkie spread", "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=700&q=70", "Breakfast pancake spread"),
    ("events", "Coffee dates welcome", "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=700&q=70", "Guest laughing over coffee"),
    ("food", "Lemon Ricotta under a snowfall of sugar", "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=700&q=70", "Lemon ricotta pancakes"),
    ("interior", "Room for the whole crew", "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=700&q=70", "Long communal tables in the cafe"),
]

CERTS = [
    ("shield", "Food Safety Certified", "Victorian Food Safety Standards"),
    ("star", "5-Star Hygiene Rating", "City of Greater Geelong"),
    ("trophy", "Best Pancakes — Geelong 2025", "Victorian Hospitality Awards"),
    ("check", "HACCP Compliant", "Certified Kitchen"),
    ("leaf", "Local Produce Partner", "Victorian Farmers' Network"),
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
        cat_map = {}
        for name, slug, icon, sort_order in CATEGORIES:
            cat, _ = Category.objects.update_or_create(
                slug=slug,
                defaults=dict(name=name, icon=icon, sort_order=sort_order, is_active=True),
            )
            cat_map[slug] = cat

        for i, (slug, name, price, desc, tag, heat, kcal, protein, prep, featured) in enumerate(MENU):
            MenuItem.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    name=name, price=price, description=desc, tag=tag, heat=heat,
                    category=cat_map.get(tag),
                    kcal=kcal, protein_g=protein, prep_time=prep,
                    image=f"/menu/{slug}.png" if slug in ["buttermilk", "berry", "choc", "banana", "lemon", "brekkie"] else "/menu/buttermilk-stack.png",
                    is_featured=featured, sort_order=i,
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

        site = SiteSettings.load()
        site.hero_heading = "Welcome to"
        site.hero_script = "The Club"
        site.hero_lead = "We pour our hearts into every stack, so you can enjoy Geelong’s best pancakes with the people you love."
        site.menu_hero_heading = "Pick your"
        site.menu_hero_script = "Favourites"
        site.menu_hero_lead = "Freshly made and served with love"
        site.promo_kicker = "Today's featured special"
        site.offers_kicker = "On right now"
        site.offers_title = "This week’s offer"
        site.cta_heading = "HUNGRY"
        site.cta_script = "Book a table now!"
        site.cta_lead = "Brunch with friends, a family catch-up or a late-night craving"
        site.cta_button_label = "BOOK A TABLE"
        site.cta_button_url = "/booking"
        site.address = "18 Pakington Street, Geelong West VIC, Australia"
        site.phone = "+61 452 135 499"
        site.email = "hello@thepancakeclub.com.au"
        site.map_embed = "https://www.google.com/maps?q=18%20Pakington%20Street%2C%20Geelong%20West%20VIC%20Australia&output=embed"
        site.transit_badges = "3 min walk from Town hall\n2hr Street Parking\nStep free access"
        site.instagram_url = "https://www.instagram.com"
        site.facebook_url = "https://www.facebook.com"
        site.uber_eats_url = "https://www.ubereats.com"
        site.timezone = "Australia/Melbourne"
        site.save()

        CAMPAIGNS = [
            (
                "New Special 20% off this weekend!",
                "band",
                "This weekend only · Dine-in & Takeaway in Geelong",
                "EXPLORE THE MENU",
                "/menu",
                "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80",
            ),
            (
                "Weekend Brunch Pass - 20% off all Stacks before 11Pm",
                "slider",
                "Saturday & Sunday ` Early birds enjoy 20% discount",
                "EXPLORE MENU",
                "/menu",
                "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80",
            ),
        ]

        for msg, placement, details, link_text, link_url, img in CAMPAIGNS:
            Announcement.objects.update_or_create(
                message=msg,
                defaults=dict(
                    placement=placement,
                    details=details,
                    link_text=link_text,
                    link_url=link_url,
                    image=img,
                    is_active=True,
                ),
            )

      
        User = get_user_model()
        admin_username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        admin_password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123456")
        admin_email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@thepancakeclub.com")

        user, created = User.objects.get_or_create(
            username=admin_username,
            defaults={"email": admin_email, "is_staff": True, "is_superuser": True},
        )
        user.is_staff = True
        user.is_superuser = True
        user.set_password(admin_password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Superuser '{admin_username}' configured."))

        self.stdout.write(self.style.SUCCESS("Demo content seeded."))
