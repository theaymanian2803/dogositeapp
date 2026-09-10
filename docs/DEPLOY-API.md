# Deploying the API per client

1. Create the client's Turso database and seed it:
   `TURSO_DB_URL=... TURSO_AUTH_TOKEN=... npm run seed -w api`
2. Create a Vercel project with **Root Directory** = `api` (repo `dogositeapp`).
   Enable "Include source files outside of the Root Directory in the Build Step".
   Set the Build Command to `npm run build:vercel`.
3. Set environment variables (Production): `TURSO_DB_URL`, `TURSO_AUTH_TOKEN`,
   `JWT_SECRET` (random 32+ chars), `CRON_SECRET` (random 32+ chars).
4. Deploy: `vercel --prod` (or connect the repo).
5. Create a cron job at cron-job.org (free) calling
   `https://<api-host>/cron/new-orders?secret=<CRON_SECRET>` every 1 minute.
6. Verify: `GET https://<api-host>/health` returns `{"ok":true}`.
7. Smoke test: `GET https://<api-host>/health` returns `{"ok":true}`; sign in as admin and place a test order through the app.

The seed script is designed for a fresh client database; re-running it duplicates products/orders/reviews.
