import uuid
from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone 
from django.core.cache import cache 


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ClubMember(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    marketing_consent = models.BooleanField(default=False)
    marketing_consented_at = models.DateTimeField(null=True, blank=True)
    privacy_accepted_at = models.DateTimeField()
    consent_version = models.CharField(max_length=30, default="club-v1")

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(models.functions.Lower("email"), name="club_email_ci_unique"),
        ]

    def __str__(self):
        return self.name


class Category(TimeStampedModel):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    icon = models.CharField(
        max_length=30,
        blank=True,
        default="🥞",
        help_text="Emoji or icon identifier, e.g. 🥞, 🍯, 🥑, 🍫, ☕",
    )
    description = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.icon} {self.name}".strip() if self.icon else self.name

    def save(self, *args, **kwargs):
        if not self.slug and self.name:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class MenuItem(TimeStampedModel):
    class Tag(models.TextChoices):
        SWEET = "sweet", "Sweet"
        SAVOURY = "savoury", "Savoury"
        CHOC = "choc", "Choc Loaded"

    class Heat(models.TextChoices):
        NONE = "none", "None"
        MEDIUM = "medium", "Medium"
        HOT = "hot", "Hot"

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="menu_items",
    )
    tag = models.CharField(max_length=60, default=Tag.SWEET, blank=True)
    heat = models.CharField(max_length=12, choices=Heat.choices, default=Heat.NONE)
    kcal = models.PositiveIntegerField(null=True, blank=True)
    protein_g = models.PositiveIntegerField(null=True, blank=True)
    prep_time = models.CharField(max_length=30, blank=True)
    image = models.CharField(
        max_length=300,
        blank=True,
        help_text="Transparent cutout used on tiles and thumbs, e.g. /menu/berry.png",
    )
    photo = models.CharField(
        max_length=300,
        blank=True,
        default="",
        help_text="Original photo for framed cards; falls back to the cutout when blank",
    )
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def save(self, *args, **kwargs):
        if self.category:
            self.tag = self.category.slug
        elif self.tag and not self.category and getattr(self, "_state", None) and self._state.adding:
            cat = Category.objects.filter(slug=self.tag).first()
            if cat:
                self.category = cat
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MenuItemPhoto(TimeStampedModel):
    """Extra real-life shots of a dish, shown in the gallery rail on its page."""

    menu_item = models.ForeignKey(MenuItem, related_name="photos", on_delete=models.CASCADE)
    image = models.CharField(max_length=300)
    alt = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.menu_item.name} photo #{self.pk}"


class Booking(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=120)
    # blank allowed for staff-entered phone bookings; the public form requires it
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    date = models.DateField()
    time = models.TimeField()
    party_size = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    preselected_dish = models.CharField(
        max_length=400,
        blank=True,
        default="",
        help_text="Optional favourite menu items pre-selected by the guest, comma-separated",
    )
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ["-date", "-time"]

    @property
    def reference(self):
        return f"TPC-BK-{str(self.public_id).replace('-', '')[-6:].upper()}"

    def __str__(self):
        return f"{self.name} — {self.date} {self.time} x{self.party_size}"


class Coupon(TimeStampedModel):
    """A discount code the staff hand out; the customer types it in the cart.

    The customer's browser only ever sends the CODE — every dollar is worked out
    here, the same rule the order's price snapshot already follows. A coupon is
    "usable" only if is_active, inside its date window, under its usage limit,
    and the cart clears min_subtotal.
    """

    class Kind(models.TextChoices):
        PERCENT = "percent", "Percent off"
        FIXED = "fixed", "Fixed amount off"

    # stored upper-case so "weekend20" and "WEEKEND20" are the same coupon
    code = models.CharField(max_length=24, unique=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.PERCENT)
    # percent: 20 = 20% off · fixed: 20 = $20 off
    # Decimal, not 0.01: a float bound on a DecimalField compares across types
    # and Django warns about exactly this
    value = models.DecimalField(
        max_digits=6, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    # a percent coupon with no ceiling turns a $200 catering order into a $40 gift
    max_discount = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        help_text="Percent coupons only — the most this code can ever take off.",
    )
    min_subtotal = models.DecimalField(
        max_digits=7, decimal_places=2, default=0,
        help_text="Cart must reach this before the code applies.",
    )
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(
        null=True, blank=True, help_text="Total redemptions allowed. Blank = unlimited.",
    )
    # counts reservations, not payments: incremented when an order claims the
    # code and released again if that order's checkout expires unpaid
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    description = models.CharField(
        max_length=120, blank=True, help_text="Staff note — never shown to customers.",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} ({self.discount_label})"

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    @property
    def discount_label(self):
        # "%g" via float, not Decimal's own :g — Decimal keeps its trailing
        # zeros, so 20.00 formatted itself as "20.00% off"
        trimmed = "%g" % self.value
        if self.kind == self.Kind.PERCENT:
            return f"{trimmed}% off"
        return f"${trimmed} off"

    @property
    def is_exhausted(self):
        return self.usage_limit is not None and self.times_used >= self.usage_limit

    def unusable_reason(self, subtotal):
        """None when the code applies, else the sentence to show the customer.

        Deliberately vague about *why* a code is dead — "not valid" tells a
        guesser nothing, while "expired" confirms the code exists.
        """
        now = timezone.now()
        if not self.is_active:
            return "That code isn't valid."
        if self.starts_at and now < self.starts_at:
            return "That code isn't valid yet."
        if self.ends_at and now > self.ends_at:
            return "That code has expired."
        if self.is_exhausted:
            return "That code has been fully claimed."
        if subtotal < self.min_subtotal:
            return f"Spend ${'%g' % self.min_subtotal} to use this code."
        return None

    def discount_for(self, subtotal):
        """Dollars off `subtotal`, rounded to cents, never more than the total."""
        from decimal import ROUND_HALF_UP

        if self.kind == self.Kind.PERCENT:
            amount = subtotal * self.value / Decimal("100")
            if self.max_discount is not None:
                amount = min(amount, self.max_discount)
        else:
            amount = self.value
        # a $20 code on a $14 stack must not make the order negative
        amount = min(amount, subtotal)
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        # awaiting Stripe payment — hidden from the kitchen until paid
        PENDING_PAYMENT = "pending_payment", "Awaiting payment"
        RECEIVED = "received", "Received"
        PREPARING = "preparing", "Preparing"
        READY = "ready", "Ready for pickup"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    customer_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    # shown to the customer in the cancellation email
    cancel_reason = models.CharField(max_length=200, blank=True)
    payment_status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )
    stripe_session_id = models.CharField(max_length=255, blank=True, db_index=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True)
    # PROTECT: a coupon that has been redeemed is part of the sales record
    coupon = models.ForeignKey(
        "Coupon", null=True, blank=True, related_name="orders", on_delete=models.PROTECT
    )
    # snapshots, like unit_price: editing or renaming the coupon later must not
    # rewrite what this customer was actually charged
    coupon_code = models.CharField(max_length=24, blank=True)
    discount_amount = models.DecimalField(max_digits=7, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    @property
    def subtotal(self):
        return sum((item.unit_price * item.quantity for item in self.items.all()), start=0)

    @property
    def total(self):
        # discount_amount is a snapshot and already capped at the subtotal
        return self.subtotal - self.discount_amount

    @property
    def reference(self):
        return f"TPC-{str(self.public_id).replace('-', '')[-6:].upper()}"

    def __str__(self):
        return f"Order {self.public_id} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, related_name="order_items", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    # snapshot of the price at order time; menu price changes must not rewrite history
    unit_price = models.DecimalField(max_digits=6, decimal_places=2)

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity} × {self.menu_item.name}"


class Review(TimeStampedModel):
    name = models.CharField(max_length=120)
    suburb = models.CharField(max_length=80, blank=True)
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    quote = models.TextField()
    avatar = models.CharField(max_length=8, blank=True, help_text="Emoji shown next to the name")
    is_approved = models.BooleanField(default=False, help_text="Only approved reviews are public")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.rating}★)"


class GalleryPhoto(TimeStampedModel):
    class Album(models.TextChoices):
        FOOD = "food", "Food"
        INTERIOR = "interior", "Interior"
        EVENTS = "events", "Events"

    class Focus(models.TextChoices):
        TOP = "top", "Keep the top"
        CENTER = "center", "Keep the middle"
        BOTTOM = "bottom", "Keep the bottom"

    album = models.CharField(max_length=12, choices=Album.choices)
    # grid cells crop to a fixed shape; this says which part survives the crop
    focus = models.CharField(max_length=8, choices=Focus.choices, default=Focus.CENTER)
    caption = models.CharField(max_length=200)
    image = models.CharField(max_length=300)
    alt = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.caption


class Announcement(TimeStampedModel):
    PLACEMENT_CHOICES = [
        ("band", "Top deal band (under the hero — changes often)"),
        ("slider", "Offers slider (after the menu — long-running)"),
    ]

    message = models.CharField(max_length=200)
    # the two homepage campaign surfaces are managed independently
    placement = models.CharField(max_length=10, choices=PLACEMENT_CHOICES, default="slider")
    # the offer panel had room for terms but nothing to put in it
    details = models.CharField(
        max_length=220,
        blank=True,
        default="",
        help_text="The conditions in one or two lines — days, dine-in or takeaway, which dishes.",
    )
    link_text = models.CharField(max_length=60, blank=True)
    link_url = models.CharField(max_length=200, blank=True)
    # optional campaign image — when set, the home page shows the big banner
    image = models.CharField(max_length=300, blank=True, default="")
    # the band's two right-side voucher cards, by menu-item slug.
    # card 1 empty = the offer photo itself; card 2 empty = first featured dish.
    card1_dish = models.CharField(max_length=100, blank=True, default="")
    card2_dish = models.CharField(max_length=100, blank=True, default="")
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message

    @classmethod
    def live(cls):
        """Every campaign that is on right now, in display order."""
        now = timezone.now()
        return (
            cls.objects.filter(is_active=True)
            .exclude(starts_at__gt=now)
            .exclude(ends_at__lt=now)
            .order_by("-created_at")
        )

    @classmethod
    def current(cls):
        """The big band under the hero: the newest live band deal, if any."""
        return cls.live().filter(placement="band").first()


class HomeStep(TimeStampedModel):
    """One card in the "How Pickup Works" row — was three hard-coded blocks."""

    label = models.CharField(max_length=20, help_text='e.g. "Step 1"')
    title = models.CharField(max_length=80)
    text = models.CharField(max_length=200)
    image = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.label} — {self.title}"


class Certification(TimeStampedModel):
    icon = models.CharField(max_length=8, default="🏅", help_text="Emoji shown on the badge")
    # real certificate/award logo — when set it replaces the built-in icon
    image = models.CharField(max_length=300, blank=True, default="")
    title = models.CharField(max_length=80)
    subtitle = models.CharField(max_length=120, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class SiteSettings(models.Model):
    """Singleton holding every editable content block and business detail
    shown on the public site and in customer emails."""

    hero_heading = models.CharField(max_length=60, default="Stack Into")
    hero_script = models.CharField(max_length=60, default="Happiness")
    hero_lead = models.TextField(
        default="Warm pancake stacks, made to order and served for relaxed "
                "catch-ups with your favourite people."
    )
    hero_image = models.CharField(
        max_length=300,
        default="https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=1200&q=80",
    )
    # transparent-PNG product shot standing on the hero blob (V2 design)
    hero_cutout = models.CharField(max_length=300, default="/menu/hero-stack.png")
    # editable copy for the About block; the heading was hard-coded in the page
    about_heading = models.CharField(max_length=60, default="Fluffy. Golden.")
    about_script = models.CharField(max_length=60, default="Fully Stacked.")
    about_image_1 = models.CharField(max_length=300, blank=True, default="")
    about_image_2 = models.CharField(max_length=300, blank=True, default="")
    about_image_3 = models.CharField(max_length=300, blank=True, default="")
    about_points = models.TextField(
        blank=True,
        default="Made to order on the griddle\n"
                "Sweet and savoury choices\n"
                "Dine in or order pickup\n"
                "Freshly prepared for every guest",
        help_text="One tick per line. These are public claims — keep them true.",
    )
    # inner-page heroes: this copy was hard-coded in the pages
    menu_hero_heading = models.CharField(max_length=60, default="Stacks On")
    menu_hero_script = models.CharField(max_length=60, default="Stacks.")
    menu_hero_lead = models.CharField(
        max_length=200, default="Signature pancake stacks. Griddled to order. Zero regrets."
    )
    gallery_hero_kicker = models.CharField(max_length=60, default="Feast Your Eyes")
    gallery_hero_heading = models.CharField(max_length=60, default="The")
    gallery_hero_script = models.CharField(max_length=60, default="Gallery.")
    gallery_hero_lead = models.CharField(
        max_length=200, default="Our food, our space, and the good times in between."
    )
    booking_hero_kicker = models.CharField(max_length=60, default="Request Online — Free & Easy")
    booking_hero_heading = models.CharField(max_length=60, default="Book a")
    booking_hero_script = models.CharField(max_length=60, default="Table.")
    booking_hero_lead = models.CharField(
        max_length=200,
        default="Pick a date, pick a time — we'll have the griddle hot when you arrive.",
    )
    # Join Our Club page content (Hero, 3 Bento cards, Member Pass, 3 Privileges)
    club_hero_kicker = models.CharField(max_length=80, default="The Pancake Club")
    club_hero_heading = models.CharField(max_length=60, default="Good food.")
    club_hero_script = models.CharField(max_length=60, default="Better company.")
    club_hero_lead = models.CharField(
        max_length=250,
        default="Fluffy homemade stacks, secret tasting invites, and a table always saved for you.",
    )
    club_bento_1_img = models.CharField(
        max_length=300,
        blank=True,
        default="https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80",
    )
    club_bento_1_badge = models.CharField(max_length=60, blank=True, default="🥞 Fresh Off The Griddle")
    club_bento_1_title = models.CharField(max_length=60, blank=True, default="Signature Stack")
    club_bento_1_sub = models.CharField(max_length=80, blank=True, default="Warm from the griddle")

    club_bento_2_img = models.CharField(
        max_length=300,
        blank=True,
        default="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80",
    )
    club_bento_2_badge = models.CharField(max_length=60, blank=True, default="🥞 Sunday Brunch")
    club_bento_2_title = models.CharField(max_length=60, blank=True, default="Brunch Club")
    club_bento_2_sub = models.CharField(max_length=80, blank=True, default="Weekend Table")

    club_bento_3_img = models.CharField(
        max_length=300,
        blank=True,
        default="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    )
    club_bento_3_badge = models.CharField(max_length=60, blank=True, default="☕ Our local parlour")
    club_bento_3_title = models.CharField(max_length=60, blank=True, default="Our Parlour")
    club_bento_3_sub = models.CharField(max_length=80, blank=True, default="Open 7 days")

    club_pass_title = models.CharField(max_length=80, blank=True, default="FOUNDING MEMBER PASS · NO. 0824")
    club_pass_sub = models.CharField(max_length=120, blank=True, default="Priority Seasonal Tastings · Secret Drops · Free Forever")
    club_pass_badge = models.CharField(max_length=40, blank=True, default="ALL WELCOME")

    club_benefit_1_badge = models.CharField(max_length=60, blank=True, default="🥞 SEASONAL TASTES")
    club_benefit_1_title = models.CharField(max_length=80, blank=True, default="Seasonal First Tastes")
    club_benefit_1_desc = models.TextField(
        blank=True,
        default="Be the first to preview autumn spiced ricotta hotcakes and summer berry compotes before public menu launch."
    )

    club_benefit_2_badge = models.CharField(max_length=60, blank=True, default="☕ PARLOUR PERKS")
    club_benefit_2_title = models.CharField(max_length=80, blank=True, default="Secret Parlour Drops")
    club_benefit_2_desc = models.TextField(
        blank=True,
        default="Occasional unlisted griddle specials, birthday stack treats, and intimate tasting invites for local regulars."
    )

    club_benefit_3_badge = models.CharField(max_length=60, blank=True, default="💛 ZERO STRINGS")
    club_benefit_3_title = models.CharField(max_length=80, blank=True, default="Always Your Choice")
    club_benefit_3_desc = models.TextField(
        blank=True,
        default="No loyalty cards to scan, no passwords to memorize. Choose your email preference and opt out anytime with one click."
    )
    # campaign section headings — the Site content studio edits these
    promo_kicker = models.CharField(
        max_length=80,
        default="✨ TODAY'S FEATURED SPECIAL",
        help_text="Gold kicker above the top deal band headline.",
    )
    offers_kicker = models.CharField(max_length=80, default="On Right Now")
    offers_title = models.CharField(
        max_length=80,
        default="This Week's Offers",
        help_text="Offers slider heading — the last word is rendered in the accent colour.",
    )
    # footer strapline, next to the copyright line
    footer_tagline = models.CharField(
        max_length=120,
        default="Fluffy stacks · made to order",
        help_text="Shown in the footer.",
    )
    # closing call to action
    cta_heading = models.CharField(max_length=60, default="Hungry?")
    cta_script = models.CharField(max_length=60, default="Book a Table.")
    cta_lead = models.CharField(
        max_length=200,
        default="Request a table online in seconds — free, with confirmation by email.",
    )
    cta_button_label = models.CharField(max_length=40, default="Book a Table")
    cta_button_url = models.CharField(max_length=200, default="/booking")
    # ticker strip; one phrase per line, separated by ✦ on the site
    marquee_words = models.TextField(
        blank=True,
        default="Fluffy Stacks\nSweet & Savoury\nMade to Order\nBrunch Together\nPickup Ready",
        help_text="One phrase per line.",
    )
    about_text = models.TextField(
        default="G'day! The Pancake Club is a place for warm stacks, relaxed catch-ups, "
                "and good food."
    )
    address = models.CharField(
        max_length=200,
        blank=True,
        default="",
    )
    phone = models.CharField(max_length=30, default="+61 452 135 499")
    # international format; blank hides the floating WhatsApp button
    whatsapp = models.CharField(max_length=30, blank=True, default="")
    email = models.EmailField(default="hello@thepancakeclub.com.au")
    abn = models.CharField(max_length=40, blank=True, default="")
    map_embed = models.CharField(
        max_length=500,
        blank=True,
        default="",
    )
    # "Find Us" info chips shown under the address — one chip per line.
    # Defaults mirror the previously hardcoded chips so existing sites look
    # unchanged after the migration.
    transit_badges = models.TextField(
        blank=True,
        default="",
        help_text="One transit/parking/access chip per line",
    )
    show_transit_badges = models.BooleanField(default=False)
    instagram_url = models.CharField(max_length=200, blank=True)
    facebook_url = models.CharField(max_length=200, blank=True)
    uber_eats_url = models.CharField(
        max_length=300,
        blank=True,
        default="",
        help_text="Link to Uber Eats store",
    )
    online_ordering_enabled = models.BooleanField(
        default=True,
        help_text="Turn online takeaway ordering on/off from admin panel",
    )
    online_ordering_disabled_message = models.CharField(
        max_length=250,
        blank=True,
        default="Online ordering is temporarily paused. Please visit us or call to place an order.",
        help_text="Notice shown to guests when online ordering is paused",
    )
    order_prep_time = models.CharField(
        max_length=60,
        blank=True,
        default="15–20 mins",
        help_text="Estimated preparation and pickup time displayed to customers in cart and checkout",
    )
    timezone = models.CharField(max_length=50, default="Australia/Melbourne")

    THEME_CHOICES = [
        ("golden", "Golden Morning"),
        ("berry", "Berry Crush"),
        ("mint", "Minty Fresh"),
        ("choco", "Choc Latte"),
        ("maple", "Maple Gold"),
        ("custom", "Custom"),
    ]
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default="maple")
    # client-picked colours, used only when theme == "custom"; the frontend
    # derives hover/soft/script variants and auto-fixes unreadable contrast
    custom_primary = models.CharField(max_length=7, default="#efbf38")
    custom_accent = models.CharField(max_length=7, default="#e08600")

    class Meta:
        verbose_name_plural = "Site settings"

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce the singleton
        super().save(*args, **kwargs)

        cache.delete("site-timezone")  # middleware picks up changes immediately

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Site settings"


class OpeningHours(models.Model):
    label = models.CharField(max_length=60, help_text='e.g. "Monday – Thursday"')
    opens = models.TimeField()
    closes = models.TimeField()
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
        verbose_name_plural = "Opening hours"

    def __str__(self):
        return f"{self.label}: {self.opens}–{self.closes}"
