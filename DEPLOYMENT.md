# CertifyPro deployment preparation

## Backend environment
Configure these variables in your hosting provider's secret/environment settings:
PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL,
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM.
Set `SUPPORT_EMAIL` to the address shown in credential-email footers.

Never upload backend/.env or real secrets to Git.

Credential emails are sent by the backend through the configured SMTP provider.
For SMTP port 587, use `SMTP_SECURE=false`; for port 465, use
`SMTP_SECURE=true`. `MAIL_FROM` must be an address authorized by the provider.
If SMTP is missing, issuance still creates the certificate but reports that no
email was sent; resend reports the configuration error instead of claiming
success. If delivery fails despite all variables being set, check the backend
logs and the provider's sender/domain verification requirements.

Certificate emails are queued after issuance or resend so PDF generation and
SMTP delivery do not block the API response. The email status updates from
pending to sent or failed in the credential list.

## Backend
Working directory: backend
Install: npm install
Start: npm start
Health check: /api/health

## Frontend
Install: npm install
Build: npm run build
Publish the generated dist directory using a static hosting provider.
Configure the frontend API proxy or production API base URL for your chosen host.

## Before going live
- Use HTTPS for frontend and backend.
- Set FRONTEND_URL to the exact production frontend origin.
- Use a production MongoDB database and restrict network access.
- Use a strong unique JWT_SECRET.
- Verify the SMTP sender domain and configure SPF, DKIM and DMARC.
- Test login, issuance, PDF attachments, public verification and revocation.
- Configure backups and monitoring.

Actual deployment requires selecting hosting providers and a domain.


## Automated project verification

From the repository root:

- `npm run build` builds the production frontend.
- `npm test` runs the backend end-to-end test.
- `npm run verify` builds the frontend, checks backend JavaScript syntax, and runs the backend end-to-end test.

The end-to-end test uses the configured MongoDB database and removes its temporary test records after completion. Run it against a development/test database, not a production database.

## Current quality and release checks

- `npm run lint` runs ESLint across the repository and currently passes without reported issues.
- `npm run verify` runs the production frontend build, backend syntax checks, and backend end-to-end integration tests.
- In production, set `NODE_ENV=production` and `FRONTEND_URL` to the exact HTTPS frontend origin. Localhost development origins are enabled only outside production.
- Keep `backend/.env` out of Git. Configure all production secrets through the hosting provider's secret manager.

Before production release, manually verify mobile layouts, automatic expiry after the scheduler interval, bulk upload limits, and the complete login-to-issuance workflow. Configure production hosting, HTTPS, domain email authentication, monitoring, and database backups before going live.
