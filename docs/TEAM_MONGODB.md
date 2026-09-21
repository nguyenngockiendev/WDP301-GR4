# Shared MongoDB Atlas setup for the team

The application supports one shared development database through MongoDB Atlas. Every team member connects with a local `backend/.env`; this file is ignored by Git.

## One-time setup by the database owner

1. Create a MongoDB Atlas organization/project for the team and a free or paid cluster.
2. In **Database Access**, create a database user with a strong password. For development, grant `readWrite` only on the `boarding_house` database. Do not use the Atlas account password as the database password.
3. In **Network Access**, add each team member's current IP address. Use the temporary `0.0.0.0/0` rule only for short-lived classroom development, then remove it. Atlas access remains protected by the database username/password.
4. Obtain the Driver connection string and replace `<db_username>`, `<db_password>`, and `<cluster>` locally.
5. Send the completed connection string only through a private channel approved by the team. Never commit it, place it in README, or expose it in a screenshot.

## Per-member configuration

In the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` and set:

```dotenv
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster>.mongodb.net/boarding_house?retryWrites=true&w=majority
SESSION_SECRET=<shared-development-secret-at-least-32-characters>
```

Use URL encoding for special characters in the MongoDB password. Example: `@` becomes `%40` and `#` becomes `%23`.

Then initialize indexes once, after the connection string is configured:

```powershell
npm ci --prefix backend
npm --prefix backend run db:init
```

Only one designated teammate should run `npm --prefix backend run seed` against the shared database. The seed script does not overwrite an existing admin account.

## Working safely as a team

- All members run their own backend on port `4000` and frontend on port `3000`; they share Atlas data, not local sessions.
- Use a shared test/development Atlas database only. Create a separate production database later.
- Do not run scripts that clear collections against the shared database.
- Before testing destructive workflows, use unique test records and agree who cleans them up.
- Atlas needs a replica set for multi-document transactions; Atlas clusters support this.
- Rotate the database password and `SESSION_SECRET` if either is exposed.

## Verify the shared connection

Run the backend and sign in at `http://127.0.0.1:3000`. A room created by one member should appear for authorized teammates after refresh. If it does not, compare the database name at the end of `MONGODB_URI` and confirm both IP addresses are allowed in Atlas.
