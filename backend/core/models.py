import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.core.cache import cache


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


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
    tag = models.CharField(max_length=12, choices=Tag.choices, default=Tag.SWEET)
    heat = models.CharField(max_length=12, choices=Heat.choices, default=Heat.NONE)
    kcal = models.PositiveIntegerField(null=True, blank=True)
    protein_g = models.PositiveIntegerField(null=True, blank=True)
    prep_time = models.CharField(max_length=30, blank=True)
    image = models.CharField(
        max_length=300,
        blank=True,
        help_text="Path or URL the storefront can render, e.g. /menu/berry.png",
    )
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


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
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"{self.name} — {self.date} {self.time} x{self.party_size}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        RECEIVED = "received", "Received"
        PREPARING = "preparing", "Preparing"
        READY = "ready", "Ready for pickup"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    customer_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.RECEIVED)
    # shown to the customer in the cancellation email
    cancel_reason = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def total(self):
        return sum((item.unit_price * item.quantity for item in self.items.all()), start=0)

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

    album = models.CharField(max_length=12, choices=Album.choices)
    caption = models.CharField(max_length=200)
    image = models.CharField(max_length=300)
    alt = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.caption


class Announcement(TimeStampedModel):
    message = models.CharField(max_length=200)
    link_text = models.CharField(max_length=60, blank=True)
    link_url = models.CharField(max_length=200, blank=True)
    # optional campaign image — when set, the home page shows the big banner
    image = models.CharField(max_length=300, blank=True, default="")
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message

    @classmethod
    def current(cls):
        now = timezone.now()
        return (
            cls.objects.filter(is_active=True)
            .exclude(starts_at__gt=now)
            .exclude(ends_at__lt=now)
            .first()
        )


class Certification(TimeStampedModel):
    icon = models.CharField(max_length=8, default="🏅", help_text="Emoji shown on the badge")
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
        default="We flip the best homemade pancakes in Sydney — griddled to order, "
                "stacked high, drowned in real maple."
    )
    hero_image = models.CharField(
        max_length=300,
        default="https://images.unsplash.com/photo-1620991565081-82743a5a499c?w=1200&q=80",
    )
    # transparent-PNG product shot standing on the hero blob (V2 design)
    hero_cutout = models.CharField(max_length=300, default="/menu/hero-stack.png")
    about_text = models.TextField(
        default="G'day! Every pancake at The Pancake Club is ladled to order onto a buttered "
                "griddle, flipped at exactly the right bubble, and stacked warm with "
                "real maple. No shortcuts, no pre-mix — just food that feels good."
    )
    address = models.CharField(max_length=200, default="123 George Street, Sydney NSW 2000")
    phone = models.CharField(max_length=30, default="(02) 5550 1234")
    # international format; blank hides the floating WhatsApp button
    whatsapp = models.CharField(max_length=30, blank=True, default="")
    email = models.EmailField(default="hello@thepancakeclub.com.au")
    abn = models.CharField(max_length=40, default="ABN 00 000 000 000")
    map_embed = models.CharField(
        max_length=500,
        default="https://www.google.com/maps?q=George%20Street%20Sydney%20NSW&output=embed",
    )
    instagram_url = models.CharField(max_length=200, blank=True)
    facebook_url = models.CharField(max_length=200, blank=True)
    timezone = models.CharField(max_length=50, default="Australia/Sydney")

    THEME_CHOICES = [
        ("golden", "Golden Morning"),
        ("berry", "Berry Crush"),
        ("mint", "Minty Fresh"),
        ("choco", "Choc Latte"),
        ("maple", "Maple Gold"),
        ("custom", "Custom"),
    ]
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default="golden")
    # client-picked colours, used only when theme == "custom"; the frontend
    # derives hover/soft/script variants and auto-fixes unreadable contrast
    custom_primary = models.CharField(max_length=7, default="#f2be45")
    custom_accent = models.CharField(max_length=7, default="#f2789c")

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
