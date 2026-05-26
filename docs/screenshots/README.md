# Screenshot checklist — diploma defense

Save PNG screenshots in this folder before defense. Use **1920×1080** (desktop) and **390×844** (mobile) where noted.

## Demo setup

1. `docker compose up -d` + API seed + `npm run dev` (web)
2. Set `NEXT_PUBLIC_DEMO_MODE=true` in `web/.env.local` for presentation banner
3. Log in as demo accounts (shown in banner)

| Account | Email | Password |
|---------|-------|----------|
| User | `john@example.com` | `User12345!` |
| Admin | `admin@merutour.com` | `Admin123!` |

---

## User flow (required)

| # | File | Route | What to capture |
|---|------|-------|-----------------|
| 1 | `01-home-desktop.png` | `/` | Hero + search widget (Flights tab) |
| 2 | `02-home-mobile.png` | `/` | Mobile header + search (390px width) |
| 3 | `03-flights-results.png` | `/flights/results?origin=ALA&destination=IST&departureDate=...` | Results list + filters |
| 4 | `04-flight-detail.png` | `/flights/[id]` | Detail + book CTA |
| 5 | `05-hotels-results.png` | `/hotels/results?city=Antalya&checkIn=...` | Hotel cards + sidebar filters |
| 6 | `06-hotel-detail.png` | `/hotels/[id]` | Gallery, amenities, booking card |
| 7 | `07-tours-list.png` | `/tours` | Grid + filters sidebar |
| 8 | `08-hot-tours.png` | `/hot-tours` | Hot deals + countdown |
| 9 | `09-tour-detail.png` | `/tours/[id]` | Package detail + book |
| 10 | `10-destinations.png` | `/destinations` | Destination grid |
| 11 | `11-destination-detail.png` | `/destinations/[slug]` | Hero + tours section |
| 12 | `12-auth-login.png` | `/auth/login` | Login form + demo hint |
| 13 | `13-account-favorites.png` | `/account/favorites` | Saved items (logged in) |
| 14 | `14-notifications.png` | Any (header) | Notifications dropdown open |
| 15 | `15-checkout-dev.png` | `/checkout/[bookingId]` | Dev confirm (no Stripe) |
| 16 | `16-account-bookings.png` | `/account/bookings` | Tabs: flights / stays / tours |
| 17 | `17-contact.png` | `/contact` | Contact form |
| 18 | `18-about.png` | `/about` | About page |

## Admin flow (required)

| # | File | Route | What to capture |
|---|------|-------|-----------------|
| 19 | `19-admin-dashboard.png` | `/admin` | Stats cards + revenue chart |
| 20 | `20-admin-tours-crud.png` | `/admin/tours` | Table + edit modal open |
| 21 | `21-admin-hotels.png` | `/admin/hotels` | Hotel list |
| 22 | `22-admin-bookings.png` | `/admin/bookings` | Booking management |
| 23 | `23-admin-users.png` | `/admin/users` | User roles / ban |
| 24 | `24-admin-reviews.png` | `/admin/reviews` | Review moderation |
| 25 | `25-admin-hot-tours.png` | `/admin/hot-tours` | Hot deal management |

## Empty / error states (optional but strong for thesis)

| # | File | How to trigger |
|---|------|----------------|
| 26 | `26-empty-bookings.png` | New user with no bookings |
| 27 | `27-empty-search.png` | Search with impossible filters |
| 28 | `28-demo-banner.png` | Homepage with `NEXT_PUBLIC_DEMO_MODE=true` |

---

## Demo script (5–7 min)

1. **Home** → search flight ALA → IST → results → detail → book (login if needed)
2. **Checkout** → dev confirm → **Account bookings** → show confirmed
3. **Hot tours** → filter last minute → open deal → favorites
4. **Admin** → dashboard → edit tour → show bookings
5. **Mobile** (resize): header icons, menu, tour card grid

Reference in thesis: `docs/user-guide.md`, `docs/admin-guide.md`, `docs/architecture.md`.
