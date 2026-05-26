# ERD — Meru Tour Database

PostgreSQL schema managed by Prisma. Core entities for diploma defense.

```mermaid
erDiagram
  User ||--o{ Booking : places
  User ||--o{ Favorite : saves
  User ||--o{ Review : writes
  User ||--o{ Notification : receives
  User ||--o{ PaymentMethod : owns
  User ||--o{ Payment : pays

  Country ||--o{ City : contains
  City ||--o{ Hotel : hosts
  City ||--o{ Resort : has
  City ||--o{ Tour : destination
  Country ||--o{ Tour : country

  Resort ||--o{ Hotel : optional
  Hotel ||--o{ Tour : package
  Tour ||--o| HotTour : deal
  Tour ||--o{ Booking : booked
  Flight ||--o{ Booking : booked
  Hotel ||--o{ Booking : booked

  Booking ||--o| Payment : has
  Favorite }o--|| Flight : optional
  Favorite }o--|| Hotel : optional
  Favorite }o--|| Tour : optional

  Review }o--|| Hotel : optional
  Review }o--|| Tour : optional
  Review }o--|| Flight : optional

  User {
    string id PK
    string email UK
    string role
    boolean banned
    boolean emailVerified
  }

  Country {
    string id PK
    string name
    string code UK
  }

  City {
    string id PK
    string countryId FK
    string name
    string airportCode
  }

  Resort {
    string id PK
    string cityId FK
    string beachType
    float rating
  }

  Hotel {
    string id PK
    string cityId FK
    string resortId FK
    float pricePerNight
    int stars
  }

  Tour {
    string id PK
    string cityId FK
    string hotelId FK
    float price
    int availableSeats
    boolean hotTour
  }

  HotTour {
    string id PK
    string tourId FK UK
    float originalPrice
    float discountedPrice
    int discountPercent
    datetime validUntil
    int seatsLeft
  }

  Flight {
    string id PK
    string originCode
    string destinationCode
    datetime departureTime
    float price
  }

  Booking {
    string id PK
    string userId FK
    enum type
    enum status
    float totalPrice
    string reference UK
  }

  Favorite {
    string id PK
    string userId FK
    string flightId FK
    string hotelId FK
    string tourId FK
  }

  Review {
    string id PK
    string userId FK
    int rating
    boolean verified
    boolean featured
  }

  Notification {
    string id PK
    string userId FK
    string title
    boolean read
  }
```

## Supporting tables

- **SearchLocation** — denormalized index for autocomplete
- **ExternalOffer** — optional cache for hybrid provider architecture (not required for seed-only demo)
- **NewsletterSubscription**, **ContactInquiry** — marketing & support
- **Destination**, **VacationCategory** — CMS-style content

## Seed volumes (typical)

| Entity | Count |
|--------|------:|
| Countries | 250+ |
| Cities | 9,000+ |
| Hotels | 24,000+ |
| Tours | 3,500+ |
| Flights | 6,000+ |
| Hot tours | 250+ |
