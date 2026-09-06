"""Stripe payments: Checkout Sessions, the webhook that confirms them, refunds.

Flow: an order is created as pending_payment/unpaid, the customer pays on
Stripe's hosted Checkout page, and the `checkout.session.completed` webhook —
never the browser redirect — promotes it to received/paid and triggers the
emails. Prices are always taken from the order's server-side snapshot.
"""
import logging
import time

import stripe
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Order

log = logging.getLogger(__name__)

# Stripe's minimum; abandoned sessions fire checkout.session.expired after this
CHECKOUT_EXPIRE_SECONDS = 30 * 60


class PaymentError(Exception):
    """Raised when Stripe can't give us a checkout session."""


def create_checkout_session(order) -> str:
    """Create an AUD Checkout Session for the order and return its URL."""
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentError("STRIPE_SECRET_KEY is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY

    line_items = [
        {
            "quantity": item.quantity,
            "price_data": {
                "currency": "aud",
                # menu prices are GST-inclusive; unit_amount is in cents
                "unit_amount": int(item.unit_price * 100),
                "product_data": {"name": item.menu_item.name},
            },
        }
        for item in order.items.select_related("menu_item")
    ]

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            currency="aud",
            customer_email=order.email or None,
            metadata={"order_public_id": str(order.public_id)},
            expires_at=int(time.time()) + CHECKOUT_EXPIRE_SECONDS,
            success_url=f"{settings.FRONTEND_URL}/order/success?order={order.public_id}",
            cancel_url=f"{settings.FRONTEND_URL}/menu?payment=cancelled",
        )
    except stripe.StripeError as exc:
        log.error("Stripe session create failed for order %s: %s", order.public_id, exc)
        raise PaymentError(str(exc)) from exc

    order.stripe_session_id = session.id
    order.save(update_fields=["stripe_session_id"])
    return session.url


def refund_order(order) -> None:
    """Full refund of a paid order; caller decides what to do on failure."""
    if order.payment_status != Order.PaymentStatus.PAID or not order.stripe_payment_intent:
        return
    stripe.api_key = settings.STRIPE_SECRET_KEY
    stripe.Refund.create(payment_intent=order.stripe_payment_intent)
    order.payment_status = Order.PaymentStatus.REFUNDED
    order.save(update_fields=["payment_status"])


def _mark_paid(session) -> None:
    from . import emails

    # completed fires even for delayed methods (e.g. bank debits) before the
    # money moves; those settle via async_payment_succeeded instead
    if session.get("payment_status") == "unpaid":
        log.info("Stripe webhook: session %s completed but not yet paid", session.get("id"))
        return

    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(
                public_id=session["metadata"]["order_public_id"]
            )
        except (Order.DoesNotExist, KeyError):
            log.error("Stripe webhook: no order for session %s", session.get("id"))
            return
        if order.payment_status == Order.PaymentStatus.PAID:
            return  # webhook retry — already handled

        order.payment_status = Order.PaymentStatus.PAID
        order.stripe_payment_intent = session.get("payment_intent") or ""
        if order.status == Order.Status.PENDING_PAYMENT:
            order.status = Order.Status.RECEIVED
        # Checkout collects the email even when our form didn't
        if not order.email and session.get("customer_details"):
            order.email = session["customer_details"].get("email") or ""
        order.save()

    emails.order_status_changed(order)  # "we've got your order" confirmation
    emails.staff_new_order(order)


def _expire_unpaid(session) -> None:
    """Customer walked away from Checkout — quietly retire the order."""
    updated = Order.objects.filter(
        stripe_session_id=session["id"],
        status=Order.Status.PENDING_PAYMENT,
        payment_status=Order.PaymentStatus.UNPAID,
    ).update(status=Order.Status.CANCELLED, cancel_reason="Payment was not completed.")
    if updated:
        log.info("Stripe webhook: expired unpaid session %s", session["id"])


@csrf_exempt
@require_POST
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET:
        log.error("Stripe webhook hit but STRIPE_WEBHOOK_SECRET is not set.")
        return HttpResponse(status=500)
    try:
        event = stripe.Webhook.construct_event(
            request.body,
            request.headers.get("Stripe-Signature"),
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError):
        return HttpResponse(status=400)

    # StripeObject supports [] but not dict's .get() — normalise once here
    session = event["data"]["object"]
    if hasattr(session, "to_dict"):
        session = session.to_dict()

    if event["type"] in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        _mark_paid(session)
    elif event["type"] in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        _expire_unpaid(session)

    return JsonResponse({"received": True})
