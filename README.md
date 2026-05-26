# Meru Tour — Full-Stack Travel Booking Platform

**Diploma documentation:** see [`docs/`](./docs/README.md) (ERD, architecture, sequences, user/admin guides).

Production-style travel SaaS (tours, flights, hotels, hot deals) with PostgreSQL seed data — no paid API keys required for defense.

## Architecture

```
meru-tour/
├── web/                 # Next.js 15 App Router frontend
├── api/                 # NestJS REST API + Prisma
└── docker-compose.yml   # PostgreSQL
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, TanStack Query, Zustand |
| Backend | NestJS, JWT, Prisma ORM, Stripe, Nodemailer |
| Database | PostgreSQL (24k+ hotels, 3.5k+ tours seeded) |

## Quick Start

### 1. PostgreSQL
```bash
docker compose up -d
```

### 2. API
```bash
cd api
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```

- API: **http://localhost:4000**
- Swagger: **http://localhost:4000/api/docs**

### 3. Web
```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

- App: **http://localhost:3000**

### 4. Both from root
```bash
npm install
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | john@example.com | User12345! |
| Admin | admin@merutour.com | Admin123! |

## Main Routes

### Public
- `/` — Home, search widget (tours / flights / hotels)
- `/tours`, `/tours/results`, `/tours/[id]`
- `/hot-tours` — Hot deals with filters
- `/flights`, `/flights/results`, `/flights/[id]`
- `/hotels`, `/hotels/results`, `/hotels/[id]` (incl. Booking.com / Expedia IDs)
- `/destinations`, `/about`, `/contact`, `/terms`, `/privacy`

### Auth
- `/auth/login`, `/auth/register`, `/auth/verify`
- `/auth/forgot-password`, `/auth/reset-password`
- Middleware protects `/account/*`, `/admin/*`, `/checkout/*`

### Account
- `/account` — Dashboard
- `/account/bookings` — Cancel, pay, view tickets
- `/account/favorites` — Tours, flights, hotels
- `/account/payment` — Saved cards (Stripe or dev mode)
- `/account/settings` — Profile

### Admin
- `/admin` — Analytics dashboard
- `/admin/users` — Roles, ban, delete
- `/admin/bookings`, `/admin/payments`
- `/admin/countries`, `/admin/cities`, `/admin/destinations`
- `/admin/tours`, `/admin/hot-tours`, `/admin/flights`, `/admin/hotels`, `/admin/resorts`
- `/admin/reviews`, `/admin/contact`, `/admin/newsletter`

## Features

- **Search** — Autocomplete (countries, cities, hotels, tours), flight/hotel widget integration
- **Booking** — Flights, hotels, tours; checkout with Stripe Payment Element or dev confirm
- **Auth** — Email verify, password reset, remember me (1d / 30d JWT), 401 auto-logout
- **Favorites** — Including external hotel offers (materialized to DB)
- **Reviews** — User reviews + admin moderation (verify / feature)
- **External hotels** — Booking.com & Expedia cache (24h TTL, extended on page view)
- **Admin CRUD** — Full content management + contact inbox + newsletter list
- **Email** — SMTP for verification, reset, booking confirmation (optional)

## Environment

See `api/.env.example` for all keys. Minimum:

```env
DATABASE_URL=postgresql://meru:meru_secret@localhost:5432/meru_tour
JWT_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
ALLOW_DEV_PAYMENT_CONFIRM=true
```

Web:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # optional
```

## Payments

- **Production:** Set `STRIPE_SECRET_KEY` + Stripe publishable key on web
- **Development:** Without Stripe, use “Confirm booking (development)” on checkout
- Account payment page saves test cards in dev; real tokenization happens at checkout with Stripe

## Seed Data

After `npm run prisma:seed`:

- ~24k hotels, ~3.5k tours, ~6k flights, ~250 hot tours
- 250 countries, ~10k cities, destinations, reviews, search locations

Verify: `GET http://localhost:4000/api/public/stats`

## Scripts

| Command | Where | Description |
|---------|-------|-------------|
| `npm run start:dev` | api | NestJS watch mode |
| `npm run prisma:seed` | api | Fill database |
| `npm run build` | api / web | Production build |
| `npm run dev` | web / root | Next.js dev |
