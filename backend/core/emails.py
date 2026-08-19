"""Customer notification emails, sent when staff change a booking/order status.

Sending must never break the status change itself — failures are logged and
swallowed. The dev default (console backend) prints emails to the runserver
terminal; production uses SMTP via the DJANGO_EMAIL_* env vars.
"""
import logging

from django.core.mail import send_mail

logger = logging.getLogger(__name__)

RESTAURANT = "KRUSH Pancakes & Stacks"
ADDRESS = "123 George Street, Sydney NSW 2000"
PHONE = "(02) 5550 1234"


def _send(to: str, subject: str, body: str) -> None:
    if not to:
        return
    try:
        send_mail(subject, body, None, [to])  # from = DEFAULT_FROM_EMAIL
    except Exception:
        logger.exception("Could not send email %r to %s", subject, to)


def _nice_time(t) -> str:
    return t.strftime("%I:%M %p").lstrip("0").lower()


def _nice_date(d) -> str:
    return d.strftime("%A %d %B %Y")


def booking_status_changed(booking) -> None:
    when = f"{_nice_date(booking.date)} at {_nice_time(booking.time)}"
    guests = f"{booking.party_size} {'guest' if booking.party_size == 1 else 'guests'}"

    if booking.status == "confirmed":
        _send(
            booking.email,
            f"Your table is confirmed — {RESTAURANT} 🥞",
            f"G'day {booking.name},\n\n"
            f"Great news — your table is confirmed!\n\n"
            f"  When:   {when}\n"
            f"  Party:  {guests}\n"
            f"  Where:  {ADDRESS}\n\n"
            f"Running late or need to change plans? Call us on {PHONE}.\n\n"
            f"See you soon,\n{RESTAURANT}",
        )
    elif booking.status == "cancelled":
        _send(
            booking.email,
            f"About your booking — {RESTAURANT}",
            f"Hi {booking.name},\n\n"
            f"Unfortunately we couldn't take your booking for {when} ({guests}).\n\n"
            f"Please call us on {PHONE} and we'll do our best to find you "
            f"another time that works.\n\n"
            f"Sorry for the trouble,\n{RESTAURANT}",
        )


def order_status_changed(order) -> None:
    items = ", ".join(f"{i.quantity}× {i.menu_item.name}" for i in order.items.all())

    if order.status == "ready":
        _send(
            order.email,
            f"Your order is ready for pickup — {RESTAURANT} 🥞",
            f"G'day {order.customer_name},\n\n"
            f"Your order is hot off the griddle and ready to collect!\n\n"
            f"  Order:  {items}\n"
            f"  Total:  ${order.total}\n"
            f"  Where:  {ADDRESS}\n\n"
            f"See you in a minute,\n{RESTAURANT}",
        )
    elif order.status == "cancelled":
        _send(
            order.email,
            f"About your order — {RESTAURANT}",
            f"Hi {order.customer_name},\n\n"
            f"We're sorry — we had to cancel your order ({items}, ${order.total}).\n"
            f"Please call us on {PHONE} if you'd like to sort something out.\n\n"
            f"Apologies,\n{RESTAURANT}",
        )
