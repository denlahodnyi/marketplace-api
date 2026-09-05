# Marketplace API (coursework)

## About

E-commerce platform that allows users to buy/sell goods.

User stories:

- As a seller I want to place my product, so that I can sell it
- As a seller I want to create auction, so that buyers can compete for the best offer
- As a seller I want to edit a product, so that I can change its details
- As a seller I want to hide a product, so that I can make it temporarily hidden
  from the buyers without complete deletion
- As a seller I want to create discount for the product, so that it gets more
  attention from the buyers
- As a buyer I want to apply search filters, so that I can find a product
- As a buyer I want to negotiate with a buyer, so that I can make my own offer
- As a buyer I want to make a bid, so that I can make a better offer then the other
  buyers
- As a buyer I want to save a product, so that I can find it later
- As a buyer I want to get notification about saved products price change, so
  that I am informed about products that I am interested about
- As a buyer I want to rate the seller, so that others can be acknowledged about
  my experience
- As a registered user I want to change by profile details, so that other
  members see accurate and up-to-date information about me
- As a registered user I want to permanently delete my account, so that all my
  personal data is removed from the company servers
- As an admin I want to create product categories, so that more products can be
  listed on the platform
- As an admin I want to review a recently created product, so that it complies
  with platform rules

## Domain (entities, relations)

- User
  - 1-to-1 with Cart
  - 1-to-M with Product
  - M-to-M with Order
  - 1-to-M with Payment
- Product
  - 1-to-1 with User
  - 1-to-M with Cart
  - 1-to-M with Order
- Cart
  - 1-to-1 with User
  - 1-to-M with Product
- Order
  - 1-to-1 with Payment
  - M-to-M with User
  - 1-to-M with Product
- Payment
  - 1-to-1 with Order
  - 1-to-M with User

| ✔   | Domain requirements                                                  |
| :-- | :------------------------------------------------------------------- |
| ✅  | ≥ 2 user roles with different rights                                 |
| ✅  | Limited resource, competing for it (balance, seats, slots)           |
| ✅  | Operation with irreversible effect (payment, reservation, write-off) |
| ✅  | Event, about which someone needs to be notified                      |
| ✅  | Entity with files (photos, documents, avatars)                       |
| ✅  | Data that is read frequently and rarely changed                      |
| ✅  | 4–6 entities with relationships and at least one “heavy” query       |

## Architectural decisions

- DB: Postgres
- Compute model: ?
- Asynchronicity: ?
- Auth: ?
- Deploy: ?

## Trade-offs

- Postgres because I need consistency for payments; entities have clear
  relations; may need complex analytical queries

## Decisions journal
