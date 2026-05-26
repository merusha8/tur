# User Guide — Meru Tour

## Getting started

1. Open **http://localhost:3000**
2. Use demo account or register:
   - **john@example.com** / **User12345!**
3. Browse **Flights**, **Hotels**, **Tours**, **Hot Tours**, **Destinations**

![Homepage placeholder](./screenshots/home-search.png)

## Search

- **Home widget** — tabs: Tour Packages, Flights, Hotels
- **Header search** (on list pages) — autocomplete from PostgreSQL
- Autocomplete supports: countries, cities, hotels, resorts, tours
- Recent searches stored locally
- Keyboard: ↑↓ Enter Esc

## Book a tour

1. Go to **Tours** or use home search
2. Apply filters (price, meal, stars, airline)
3. Open tour detail → **Continue to checkout**
4. Sign in if prompted
5. On checkout: pay with Stripe **or** **Confirm booking (development)**
6. View booking under **Account → Bookings**

## Book a flight or hotel

Same flow from **Flights** / **Hotels** results → detail → checkout.

External provider IDs (if integration enabled) are materialized to DB on book/favorite.

## Account

| Page | URL |
|------|-----|
| Profile summary | `/account` |
| Bookings | `/account/bookings` |
| Favorites | `/account/favorites` |
| Payment methods | `/account/payment` |
| Settings | `/account/settings` |

From **Account**, use **Change** to open settings for editable fields.

## Favorites

Click **Save** / heart on tour, flight, or hotel detail pages (login required).

## Hot deals

**Hot Tours** shows discounted packages with:
- HOT badge
- Discount %
- Countdown to `validUntil`
- Seats left urgency

## Registration (demo email mode)

When SMTP is not configured:
- Verification codes are **logged in the API terminal**
- New accounts may be **auto-verified** in demo mode
- Toast: *Verification email sent* (check API console for code)

Prefer instant access? Use **john@example.com** / **User12345!**

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on account pages | Login again |
| Empty search | Run `npm run prisma:seed` in `api/` |
| API offline | `cd api && npm run start:dev` |
