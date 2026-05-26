# Admin Guide — Meru Tour

Login: **admin@merutour.com** / **Admin123!** → **Admin** in header or `/admin`.

![Admin dashboard placeholder](./screenshots/admin-dashboard.png)

## Dashboard

- User, booking, revenue stats
- Recent bookings
- Charts by type / month

## Content CRUD

| Section | URL | Actions |
|---------|-----|---------|
| Countries | `/admin/countries` | Create, edit, delete |
| Cities | `/admin/cities` | Create, edit, delete |
| Destinations | `/admin/destinations` | Create, edit, delete, featured |
| Resorts | `/admin/resorts` | Create, edit, delete |
| Hotels | `/admin/hotels` | Create, edit, delete |
| Tours | `/admin/tours` | Create, edit, delete |
| Hot Tours | `/admin/hot-tours` | Link tour, set discount, dates, seats, active |
| Flights | `/admin/flights` | Create, edit, delete |

### Hot tour fields

- `originalPrice`, `discountedPrice`, `discountPercent`
- `validFrom`, `validUntil` (expiry)
- `seatsLeft`, `lastMinute`, `isActive`, `featured`

Publishing = set **isActive** true and valid dates in the future.

## Operations

| Section | URL | Actions |
|---------|-----|---------|
| Users | `/admin/users` | Change role, ban/unban, delete (not admins) |
| Bookings | `/admin/bookings` | Update status |
| Payments | `/admin/payments` | View succeeded payments |
| Reviews | `/admin/reviews` | Verify, feature, delete |
| Contact | `/admin/contact` | Read inquiries, delete |
| Newsletter | `/admin/newsletter` | Active/inactive, delete |

## Image upload

Admin forms use **Upload** → `POST /admin/upload` → URL stored in entity.

## Demo tips for defense

1. Show **Hot Tours** admin → change discount → refresh public `/hot-tours`
2. Show **Reviews** moderation → verify a review → appears on home
3. Show **Users** ban → user cannot login
4. Show seed stats: `GET /api/public/stats`

## Security notes

- Admin routes require JWT + `ADMIN` role (API) and admin cookie (web middleware)
- Do not delete the admin demo account during live demo
