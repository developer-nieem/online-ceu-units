# Billing & Stripe (sandbox foundation)

## Overview

CAL ACE LMS uses a **dual-mode checkout**:

1. **Mock mode** (default) — no Stripe keys configured; enrollments create `Order` rows with `paymentMeta.mock` and activate courses immediately.
2. **Stripe mode** — when `STRIPE_SECRET_KEY` and price IDs are set, `POST /api/billing/checkout-session` returns a Stripe Checkout URL.

Production keys must never be committed. Use Stripe test mode only in development.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_test_...`) — optional for hosted Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_SINGLE` | Price ID for $3.75 single course (one-time) |
| `STRIPE_PRICE_UNLIMITED_1Y` | Price ID for 1-year unlimited ($19.50, recurring) |
| `STRIPE_PRICE_UNLIMITED_2Y` | Price ID for 2-year unlimited ($37.50, recurring) |
| `STRIPE_PRICE_*_LIVE` | Live-mode price IDs when `STRIPE_SECRET_KEY` is `sk_live_*` |

Placeholder values (`sk_test_replace_me`, `price_replace_*`) keep the API in mock mode.

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/billing/account` | JWT | Subscription, orders, customer |
| POST | `/api/billing/checkout-session` | JWT + CSRF | Create Checkout session or return mock hint |
| POST | `/api/billing/mock-checkout` | JWT + CSRF | Enroll via mock purchase |
| POST | `/api/webhooks/stripe` | Public | Stripe webhook (signature verified, fulfillment) |
| POST | `/api/billing/webhook` | Public | Legacy alias for Stripe webhook |

## Data model

- `BillingCustomer` — maps `User` → `stripeCustomerId`
- `Order` — line items + `paymentMeta` (Stripe session ID when live)
- `Subscription` — unlimited plans; `billingMeta` for Stripe subscription IDs (future)

## Webhook handling

`POST /api/webhooks/stripe` verifies signatures when configured. On `checkout.session.completed`,
`BillingService` calls `EnrollmentService.fulfillStripePurchase` to record the order, activate
unlimited subscriptions, and enroll paid single-course purchases. Certificate generation remains a
follow-up step.

Other events (`customer.subscription.*`, `invoice.paid`) are acknowledged but deferred.

## Local testing

1. Copy `.env.example` → `.env`
2. Leave Stripe placeholders → mock checkout on course detail and billing pages
3. Optional: [Stripe CLI](https://stripe.com/docs/stripe-cli) forward webhooks to `http://localhost:3001/api/webhooks/stripe`
