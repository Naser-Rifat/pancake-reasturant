"""Transactional customer and staff notification emails.

Sending must never break the status change itself — failures are logged and
swallowed. The dev default (console backend) prints emails to the runserver
terminal; production uses the Brevo HTTPS API through Django Anymail.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from .models import SiteSettings

logger = logging.getLogger(__name__)

RESTAURANT = "The Pancake Club"


def _info():
    """Live business details — managed by staff in the admin panel Settings page."""

    return SiteSettings.load()


def _send(to: str, subject: str, body: str, *, html_message: str | None = None) -> bool:
    if not to:
        logger.warning("Skipped email %r because no recipient was supplied", subject)
        return False
    attempts = getattr(settings, "EMAIL_SEND_ATTEMPTS", 2)
    for attempt in range(1, attempts + 1):
        try:
            sent = send_mail(
                subject,
                body,
                None,
                [to],
                fail_silently=False,
                html_message=html_message,
            )
        except Exception as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            retryable = status_code == 429 or (
                isinstance(status_code, int) and status_code >= 500
            )
            if retryable and attempt < attempts:
                logger.warning(
                    "Email provider returned HTTP %s for %r to %s; retrying (%s/%s)",
                    status_code,
                    subject,
                    to,
                    attempt,
                    attempts,
                )
                continue
            # Do not retry ambiguous network timeouts: the provider may have
            # accepted the message before the response was lost, which could
            # otherwise send customers duplicate confirmations.
            logger.exception("Could not send email %r to %s", subject, to)
            return False
        if sent != 1:
            logger.error(
                "Email backend accepted %s messages for %r to %s; expected 1",
                sent,
                subject,
                to,
            )
            return False
        logger.info("Email accepted by backend: %r to %s", subject, to)
        return True
    return False


def _nice_time(t) -> str:
    return t.strftime("%I:%M %p").lstrip("0").lower()


def _nice_date(d) -> str:
    return d.strftime("%A %d %B %Y")


def _reference(prefix: str, public_id) -> str:
    return f"{prefix}-{str(public_id).replace('-', '')[-6:].upper()}"


def _abn_number(site) -> str:
    value = (site.abn or "").strip()
    return value[3:].strip() if value.upper().startswith("ABN") else value


def _business_signature(site) -> str:
    abn = _abn_number(site)
    if not abn:
        return RESTAURANT
    return f"{RESTAURANT} · ABN {abn}"


def _customer_html(
    *,
    site,
    customer_name: str,
    preheader: str,
    badge: str,
    title: str,
    lead: str,
    details: list[tuple[str, str]] | None = None,
    notice: str = "",
    bullets_title: str = "",
    bullets: list[str] | None = None,
    action_url: str = "",
    action_label: str = "",
    support_text: str,
    closing: str,
    badge_background: str = "#fff0bf",
    badge_color: str = "#74410b",
) -> str:
    """Render one email-client-safe customer layout with auto-escaped content."""

    phone_href = "+" + "".join(filter(str.isdigit, site.phone)) if site.phone.startswith("+") else "".join(filter(str.isdigit, site.phone))
    return render_to_string(
        "emails/customer.html",
        {
            "customer_name": customer_name,
            "preheader": preheader,
            "badge": badge,
            "badge_background": badge_background,
            "badge_color": badge_color,
            "title": title,
            "lead": lead,
            "details": details or [],
            "notice": notice,
            "bullets_title": bullets_title,
            "bullets": bullets or [],
            "action_url": action_url,
            "action_label": action_label,
            "support_text": support_text,
            "closing": closing,
            "address": site.address,
            "phone": site.phone,
            "phone_href": phone_href,
            "abn": _abn_number(site),
        },
    )


def _booking_menu_selection(booking) -> str:
    selection = (booking.preselected_dish or "").strip()
    if not selection:
        return ""
    return (
        f"  Pre-selected favourites: {selection}\n"
        "  Note: These are preferences for your visit, not a paid food pre-order.\n"
    )


def booking_status_changed(booking) -> bool:
    s = _info()
    when = f"{_nice_date(booking.date)} at {_nice_time(booking.time)}"
    guests = f"{booking.party_size} {'guest' if booking.party_size == 1 else 'guests'}"
    reference = _reference("TPC-BK", booking.public_id)
    details = [("Reference", reference), ("Date & time", when), ("Party", guests)]
    selection = (booking.preselected_dish or "").strip()
    if selection:
        details.append(("Favourites", selection))
    details.append(("Location", s.address))

    if booking.status == "confirmed":
        subject = f"Booking confirmed · {reference} | {RESTAURANT}"
        body = (
            f"G'day {booking.name},\n\n"
            f"Great news — your table is confirmed.\n\n"
            f"  Reference: {reference}\n"
            f"  When:     {when}\n"
            f"  Party:    {guests}\n"
            f"{_booking_menu_selection(booking)}"
            f"  Where:    {s.address}\n\n"
            f"Running late or need to change plans? Call us on {s.phone}. "
            "Please don't reply to this automated email.\n\n"
            f"See you soon,\n{RESTAURANT}"
        )
        return _send(
            booking.email,
            subject,
            body,
            html_message=_customer_html(
                site=s,
                customer_name=booking.name,
                preheader=f"Your table for {when} is confirmed.",
                badge="BOOKING CONFIRMED",
                badge_background="#e7f5e8",
                badge_color="#24552b",
                title="Your table is confirmed",
                lead="Great news — your table is booked and we’re looking forward to welcoming you.",
                details=details,
                notice=(
                    "Your menu selections are preferences for your visit, not a paid food pre-order."
                    if selection
                    else ""
                ),
                support_text=f"Running late or need to change plans? Call us on {s.phone}. Please don’t reply to this automated email.",
                closing="See you soon,",
            ),
        )
    elif booking.status == "cancelled":
        subject = f"Booking cancelled · {reference} | {RESTAURANT}"
        body = (
            f"Hi {booking.name},\n\n"
            f"Unfortunately we couldn't take your booking for {when} ({guests}).\n\n"
            f"  Reference: {reference}\n\n"
            f"Please call us on {s.phone} and we'll do our best to find you "
            "another time that works. Please don't reply to this automated email.\n\n"
            f"Sorry for the trouble,\n{RESTAURANT}"
        )
        return _send(
            booking.email,
            subject,
            body,
            html_message=_customer_html(
                site=s,
                customer_name=booking.name,
                preheader=f"An update about booking {reference}.",
                badge="BOOKING CANCELLED",
                badge_background="#fde8e5",
                badge_color="#8a2d22",
                title="An update about your booking",
                lead="Unfortunately, we couldn’t accept this booking request.",
                details=details,
                support_text=f"Call us on {s.phone} and we’ll do our best to find another time that works. Please don’t reply to this automated email.",
                closing="Sorry for the trouble,",
            ),
        )
    return False


def booking_request_received(booking) -> bool:
    """Acknowledge a public request without implying that the table is confirmed."""
    s = _info()
    when = f"{_nice_date(booking.date)} at {_nice_time(booking.time)}"
    guests = f"{booking.party_size} {'guest' if booking.party_size == 1 else 'guests'}"
    reference = _reference("TPC-BK", booking.public_id)
    selection = (booking.preselected_dish or "").strip()
    details = [("Reference", reference), ("Requested", when), ("Party", guests)]
    if selection:
        details.append(("Favourites", selection))
    details.append(("Location", s.address))
    subject = f"Booking request received · {reference} | {RESTAURANT}"
    body = (
        f"G'day {booking.name},\n\n"
        "We've received your table request and will confirm it shortly. "
        "Your table is not confirmed until you receive a confirmation email.\n\n"
        f"  Reference: {reference}\n"
        f"  When:     {when}\n"
        f"  Party:    {guests}\n"
        f"{_booking_menu_selection(booking)}"
        f"  Where:    {s.address}\n\n"
        f"Need to change anything? Call us on {s.phone}. "
        "Please don't reply to this automated email.\n\n"
        f"Thanks,\n{RESTAURANT}"
    )
    return _send(
        booking.email,
        subject,
        body,
        html_message=_customer_html(
            site=s,
            customer_name=booking.name,
            preheader=f"We received booking request {reference}; it still needs confirmation.",
            badge="REQUEST RECEIVED",
            title="We’ve received your request",
            lead="We’ll review your table request and email you again when it is confirmed.",
            details=details,
            notice=(
                "Your table is not confirmed yet. Your menu selections are preferences only, not a paid food pre-order."
                if selection
                else "Your table is not confirmed until you receive a confirmation email."
            ),
            support_text=f"Need to change anything? Call us on {s.phone}. Please don’t reply to this automated email.",
            closing="Thanks,",
        ),
    )


def order_status_changed(order) -> bool:
    s = _info()
    items = ", ".join(f"{i.quantity}× {i.menu_item.name}" for i in order.items.all())
    reference = _reference("TPC", order.public_id)
    payment = (
        "Paid"
        if order.payment_status == "paid"
        else "Refunded"
        if order.payment_status == "refunded"
        else "Pay at counter on collection"
    )
    details = [
        ("Order", reference),
        ("Items", items),
        ("Total", f"${order.total} incl. GST"),
        ("Payment", payment),
        ("Pickup", s.address),
    ]

    if order.status == "received":
        subject = f"Order received · {reference} | {RESTAURANT}"
        body = (
            f"G'day {order.customer_name},\n\n"
            "Thanks — your order is in and the kitchen is on it.\n\n"
            f"  Order:   {reference}\n"
            f"  Items:   {items}\n"
            f"  Total:   ${order.total} (incl. GST)\n"
            f"  Payment: {payment}\n"
            f"  Pickup:  {s.address}\n\n"
            "We'll email you the moment it's ready to collect.\n\n"
            f"Need help? Call {s.phone}; please don't reply to this automated email.\n\n"
            + _business_signature(s)
        )
        return _send(
            order.email,
            subject,
            body,
            html_message=_customer_html(
                site=s,
                customer_name=order.customer_name,
                preheader=f"We received order {reference} and the kitchen is preparing it.",
                badge="ORDER RECEIVED",
                title="The kitchen has your order",
                lead="Thanks — your ticket is in and we’ll email you again as soon as it’s ready to collect.",
                details=details,
                notice="Please wait for the ready-for-pickup email before travelling to the venue.",
                support_text=f"Need help with your order? Call us on {s.phone}. Please don’t reply to this automated email.",
                closing="See you at pickup,",
            ),
        )
    elif order.status == "ready":
        subject = f"Ready for pickup · {reference} | {RESTAURANT}"
        body = (
            f"G'day {order.customer_name},\n\n"
            "Your order is hot off the griddle and ready to collect.\n\n"
            f"  Order:   {reference}\n"
            f"  Items:   {items}\n"
            f"  Total:   ${order.total} (incl. GST)\n"
            f"  Payment: {payment}\n"
            f"  Where:   {s.address}\n\n"
            f"When you arrive, quote {reference}. Need help? Call {s.phone}. "
            "Please don't reply to this automated email.\n\n"
            f"See you in a minute,\n{_business_signature(s)}"
        )
        return _send(
            order.email,
            subject,
            body,
            html_message=_customer_html(
                site=s,
                customer_name=order.customer_name,
                preheader=f"Order {reference} is ready to collect now.",
                badge="READY FOR PICKUP",
                badge_background="#e7f5e8",
                badge_color="#24552b",
                title="Your order is ready",
                lead="It’s hot off the griddle and ready to collect from our counter.",
                details=details,
                notice=f"When you arrive, quote order {reference}.",
                support_text=f"Need help? Call us on {s.phone}. Please don’t reply to this automated email.",
                closing="See you in a minute,",
            ),
        )
    elif order.status == "cancelled":
        reason = (order.cancel_reason or "No reason was provided.").strip()
        cancelled_details = details[:-1] + [("Reason", reason)]
        if order.payment_status == "refunded":
            payment_notice = (
                "Your payment has been refunded in full. It normally appears on your card "
                "within 5–10 business days."
            )
        elif order.payment_status == "unpaid":
            payment_notice = "No payment was taken for this order."
        else:
            payment_notice = f"Please call us on {s.phone} if you need help with the payment."
        subject = f"Order cancelled · {reference} | {RESTAURANT}"
        body = (
            f"Hi {order.customer_name},\n\n"
            "We're sorry — we had to cancel your order.\n\n"
            f"  Order:  {reference}\n"
            f"  Items:  {items}\n"
            f"  Total:  ${order.total} (incl. GST)\n"
            f"  Reason: {reason}\n\n"
            f"{payment_notice}\n\n"
            f"Please call us on {s.phone} if you'd like to sort something out. "
            "Please don't reply to this automated email.\n\n"
            f"Apologies,\n{_business_signature(s)}"
        )
        return _send(
            order.email,
            subject,
            body,
            html_message=_customer_html(
                site=s,
                customer_name=order.customer_name,
                preheader=f"An update about order {reference}.",
                badge="ORDER CANCELLED",
                badge_background="#fde8e5",
                badge_color="#8a2d22",
                title="Your order was cancelled",
                lead="We’re sorry — we weren’t able to complete this order.",
                details=cancelled_details,
                notice=payment_notice,
                support_text=f"Call us on {s.phone} if you’d like help. Please don’t reply to this automated email.",
                closing="Apologies,",
            ),
        )
    return False


def staff_new_order(order) -> bool:
    """Heads-up to the restaurant's own inbox — the admin panel chime only helps
    while someone is actually looking at the Orders screen."""
    s = _info()
    items = ", ".join(f"{i.quantity}× {i.menu_item.name}" for i in order.items.all())
    contact = order.phone or order.email or "no contact given"
    return _send(
        s.email,
        f"New pickup order — {items[:60]}",
        f"New order just came in:\n\n"
        f"  Customer: {order.customer_name} ({contact})\n"
        f"  Order:    {items}\n"
        f"  Total:    ${order.total} (incl. GST)\n"
        f"{('  Notes:    ' + order.notes + chr(10)) if order.notes else ''}"
        f"\nManage it in the admin panel → Orders.",
    )


def staff_new_booking(booking) -> bool:
    s = _info()
    when = f"{_nice_date(booking.date)} at {_nice_time(booking.time)}"
    contact = booking.phone or booking.email or "no contact given"
    return _send(
        s.email,
        f"New booking request — {when}",
        f"New table request:\n\n"
        f"  Name:   {booking.name} ({contact})\n"
        f"  When:   {when}\n"
        f"  Party:  {booking.party_size}\n"
        f"{('  Dishes: ' + booking.preselected_dish + chr(10)) if booking.preselected_dish else ''}"
        f"{('  Notes:  ' + booking.notes + chr(10)) if booking.notes else ''}"
        f"\nConfirm or decline in the admin panel → Bookings (the guest is emailed either way).",
    )


def club_welcome(member) -> bool:
    """Warm welcome email for new club members."""
    s = _info()
    subject = f"Welcome to the club | {RESTAURANT}"
    benefits = [
        "Seasonal first tastes before the public menu launch",
        "Secret parlour drops and birthday treats",
        "Always free — no fees or passwords, and you can leave anytime",
    ]
    body = (
        f"G'day {member.name},\n\n"
        f"You're in! Welcome to {RESTAURANT} — a place for warm stacks and "
        "good company in Geelong West.\n\n"
        "Here's what being a member means:\n"
        + "".join(f"  • {benefit}\n" for benefit in benefits)
        + "\nYour membership is active now. To update your details or leave the club, "
        f"call us on {s.phone}. Please don't reply to this automated email.\n\n"
        f"See you at the griddle,\n{RESTAURANT}\n{s.address}"
    )
    return _send(
        member.email,
        subject,
        body,
        html_message=_customer_html(
            site=s,
            customer_name=member.name,
            preheader="Your free Pancake Club membership is active now.",
            badge="MEMBERSHIP ACTIVE",
            badge_background="#e7f5e8",
            badge_color="#24552b",
            title="Welcome to the club",
            lead="You’re in — welcome to warm stacks and good company in Geelong West.",
            bullets_title="Your member privileges",
            bullets=benefits,
            action_url=f"{settings.FRONTEND_URL}/menu",
            action_label="Explore the menu",
            support_text=f"To update your details or leave the club, call us on {s.phone}. Please don’t reply to this automated email.",
            closing="See you at the griddle,",
        ),
    )


def club_already_registered(member) -> bool:
    """Confirm a repeat submission without changing consent or account state."""
    s = _info()
    subject = f"Your club membership is already active | {RESTAURANT}"
    body = (
        f"G'day {member.name},\n\n"
        "We received a club sign-up request for this email address. You're already "
        "registered, so we kept your existing membership and communication preferences "
        "unchanged.\n\n"
        "If this wasn't you, no action is needed. To update your details or leave the "
        f"club, call us on {s.phone}. Please don't reply to this automated email.\n\n"
        f"See you at the griddle,\n{RESTAURANT}"
    )
    return _send(
        member.email,
        subject,
        body,
        html_message=_customer_html(
            site=s,
            customer_name=member.name,
            preheader="Your existing club membership and preferences are unchanged.",
            badge="ALREADY A MEMBER",
            title="You’re already in the club",
            lead="We received another sign-up request for this email address, but your existing membership is already active.",
            notice="We kept your saved membership and communication preferences unchanged. If this wasn’t you, no action is needed.",
            support_text=f"To update your details or leave the club, call us on {s.phone}. Please don’t reply to this automated email.",
            closing="See you at the griddle,",
        ),
    )


def send_test(to: str) -> tuple[bool, str]:
    """One verification email for the admin panel's "send test" button.
    Unlike the notification senders this surfaces the error, because its whole
    job is telling staff whether the configured delivery backend works."""

    backend = settings.EMAIL_BACKEND
    try:
        send_mail(
            f"Test email — {RESTAURANT}",
            "If you can read this, email delivery is configured correctly.\n\n"
            "New orders, new bookings and customer confirmations will all "
            "arrive just like this one.",
            None,
            [to],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001 — the message IS the product here
        return False, f"Send failed: {exc}"
    if "console" in backend.lower():
        return False, (
            "Printed to the server console only. Configure BREVO_API_KEY for "
            "real email delivery."
        )
    if "brevo" in backend.lower():
        return True, f"Accepted by Brevo API for {to}. Check the inbox and spam folder."
    if "smtp" in backend.lower():
        return True, f"Accepted by SMTP for {to}. Check the inbox and spam folder."
    return True, f"Accepted by the email backend for {to}. Check the inbox and spam folder."
