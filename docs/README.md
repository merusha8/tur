# Meru Tour — Documentation (Diploma Defense Pack)

Documentation for the Meru Tour full-stack travel booking platform.

| Document | Description |
|----------|-------------|
| [ERD](./ERD.md) | Entity-relationship diagram (PostgreSQL / Prisma) |
| [Architecture](./architecture.md) | System layers and modules |
| [Sequences](./sequences.md) | Booking and auth flow diagrams |
| [Integrations](./integrations.md) | Seed vs live vs demo limitations |
| [User Guide](./user-guide.md) | End-user walkthrough |
| [Admin Guide](./admin-guide.md) | Administrator panel guide |

## Screenshots (placeholders)

Full checklist: [screenshots/README.md](./screenshots/README.md) — 28 shots + demo script.

## Demo presentation mode

Set in `web/.env.local`:

```
NEXT_PUBLIC_DEMO_MODE=true
```

Shows a dismissible banner with demo credentials on all pages (public, auth, checkout, account, admin).

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| User | john@example.com | User12345! |
| Admin | admin@merutour.com | Admin123! |

## Quick run

```bash
docker compose up -d
cd api && npm run prisma:seed && npm run start:dev
cd web && npm run dev
```
