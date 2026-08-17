# IdeaVault API Reference

Public routes:
- `GET /health`
- `GET /ideas`
- `GET /ideas/trending?limit=6`
- `POST /jwt` (exchanges a verified Firebase ID token for the app JWT)

Protected routes require `Authorization: Bearer <jwt>`:
- `POST /users`, `PATCH /users/:email`
- `POST /ideas`, `GET /ideas/:id`, `GET /ideas/user/:email`
- `PATCH /ideas/:id`, `DELETE /ideas/:id`, `POST /ideas/:id/like`
- `GET /comments/idea/:ideaId`, `POST /comments`, `PATCH /comments/:id`, `DELETE /comments/:id`
- `GET /interactions/:email`
- `POST /bookmarks/:ideaId`, `GET /bookmarks/:email`

Search example:
`GET /ideas?search=coach&category=AI&from=2026-01-01&to=2026-12-31`
