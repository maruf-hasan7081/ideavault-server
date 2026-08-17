# Server Deployment Checklist

1. Create a Node web service from the server repository.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Add `MONGODB_URI`, `DB_NAME`, `JWT_SECRET`, Firebase Admin values, and `CLIENT_ORIGIN`.
5. Set `CLIENT_ORIGIN` to the final Vercel URL (or comma-separated approved origins).
6. Open `/health` and confirm `{ "ok": true }`.
7. Put the deployed server URL into the client's `NEXT_PUBLIC_API_URL`.
8. Redeploy the client and test Login, Add Idea, Details, comments, My Ideas, and reload on every private route.
