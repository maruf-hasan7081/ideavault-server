# IdeaVault Server

Express and MongoDB server for IdeaVault.

## Local Setup
1. Copy `.env.example` to `.env`.
2. Add the MongoDB connection string.
3. Add a JWT secret.
4. Add Firebase Admin credentials.
5. Set `CLIENT_ORIGIN` to the client URL.
6. Run `npm install`.
7. Run `npm run dev`.

## Deployment
Deploy the server to Render and add all `.env` values in the Render environment settings.
