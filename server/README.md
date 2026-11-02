# Backend

Express JSON API on port 4000. Run `npm ci`, `npm run dev`. Configure `.env` from `.env.example`. See the root README for API, security and database setup. Tests use isolated temporary MongoDB.

## Email OTP

Account verification and password recovery use an external SMTP provider through Nodemailer. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `server/.env` before registering or requesting a password reset. Use the SMTP credentials issued by your email provider; do not commit them. OTPs expire after 10 minutes, are stored as hashes, and allow up to five verification attempts.
