# Integrations — Seed vs Live vs Demo

Meru Tour uses a **demo/live hybrid** architecture. For diploma defense, **no paid API keys are required** — all demo flows use PostgreSQL seed data.

## Summary table

| Feature | Seed / Local (default) | Live integration (optional) | Demo limitation |
|---------|------------------------|----------------------------|-----------------|
| **Flights search** | ~6,000 flights in DB | Amadeus, Skyscanner APIs | Without keys: DB only; UI shows hint |
| **Hotels search** | ~24,000 hotels in DB | Booking.com, Expedia cache | Without keys: DB only |
| **Tours / Hot tours** | Prisma seed | N/A | Fully local |
| **Search autocomplete** | `SearchLocation` + entity tables | N/A | Fully PostgreSQL |
| **Payments** | Dev confirm (`ALLOW_DEV_PAYMENT_CONFIRM`) | Stripe PaymentIntent | No real charges in demo |
| **Email** | Console log (demo mode) | SMTP (optional free/local) | Codes in API terminal |
| **Maps** | Coordinates from seed | Google Maps API | Static/fallback without key |
| **Auth** | JWT local | N/A | Demo accounts pre-verified |

## Architecture intent

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js    │────▶│  NestJS API  │────▶│ PostgreSQL  │
│  (no mocks) │     │  + optional  │     │  (seed data)│
└─────────────┘     │  integrations│     └─────────────┘
                    └──────────────┘
                           │
                    Optional (empty .env):
                    Amadeus, Booking, Expedia, Stripe, SMTP
```

## What is NOT used in diploma demo

- Paid Amadeus / Booking / Expedia subscriptions
- Production Stripe charges (unless explicitly configured)
- Paid email SaaS (SendGrid, etc.)

## Environment flags

| Variable | Purpose |
|----------|---------|
| `ALLOW_DEV_PAYMENT_CONFIRM=true` | Confirm bookings without Stripe |
| `SMTP_HOST` empty | Demo email → API console log |
| External API keys empty | Fallback to seed database |

## Honest positioning for defense

> «Catalog and search are backed by PostgreSQL with realistic seed data. Integration modules demonstrate how live providers would plug in; the demo runs fully on local data without paid APIs.»
