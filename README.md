# IdeaVault Server API

Express + MongoDB API for the IdeaVault assignment. It is kept as a separate repository from the Next.js client.

## Features
- MongoDB CRUD for startup ideas with creator ownership checks.
- Firebase ID-token verification followed by application JWT generation; JWT middleware protects private APIs.
- Comment add/edit/delete with ownership enforcement and a My Interactions aggregation.
- Case-insensitive MongoDB `$regex` title search, category filtering, date range with `$gte`/`$lte`, and server-side result limits.
- Trending aggregation using likes + comment activity, optional likes and bookmark APIs.
- User profile upsert/update and cascading cleanup of comments/bookmarks after idea deletion.

## Setup
1. Copy `.env.example` to `.env`.
2. Create a MongoDB database (Atlas or local) and set `MONGODB_URI`.
3. Create a long random `JWT_SECRET`.
4. In Firebase Console, create/download Admin SDK service-account credentials and set the three Firebase Admin variables. Preserve `\n` in the private key exactly as shown in `.env.example`.
5. Add your frontend origin to `CLIENT_ORIGIN` (comma-separated values are supported).
6. Run `npm install`, then `npm run seed` for sample content, and `npm run dev`.

## Main endpoints
- `POST /jwt`
- `GET /ideas`, `GET /ideas/trending`, `GET /ideas/:id`
- `POST/PATCH/DELETE /ideas...`
- `GET/POST/PATCH/DELETE /comments...`
- `GET /interactions/:email`
- `POST/GET /bookmarks...`
- `POST/PATCH /users...`

## Deployment
Deploy to Render or another Node host, add the environment variables, and set `CLIENT_ORIGIN` to the deployed Next.js URL.
