# SelfTape CRM — security recovery

This repository is the SelfTape CRM, not Company Theatre CRM. Previous inherited project documentation was stale and contained exposed historical login information. Never reuse historical credentials; their removal does not erase Git history.

## Current security posture (2026-10-22 UTC)

- Private pages and APIs require protected runtime HTTP Basic authentication over HTTPS, enforced by the Next16 proxy and independently by every API handler.
- Environment names: SELFETAPE_ADMIN_USER, SELFETAPE_ADMIN_PASSWORD (32+ random characters), SELFETAPE_PUBLIC_ORIGIN (exact HTTPS origin, no trailing slash).
- A separate server-to-server SELFETAPE_SIGNUP_TOKEN (32+ random characters) permits only POST /api/website-signups. It cannot read or administer contacts. The website must keep it server-side.
- New website contacts have solicitation=false and unverified consent provenance; existing contacts and suppression remain untouched. Signup does not send email.
- All sending, scheduled dispatch, SendGrid callbacks, unsigned unsubscribe and tracking endpoints are disabled. Provider function also throws before delivery. No environment toggle enables mail.
- Browser mutations require exact configured Origin; automation must explicitly supply it along with admin authentication.
- Campaign HTML preview is isolated in a sandboxed opaque-origin iframe with restrictive CSP; no script/form/top-navigation permissions.
- No schema migration. Existing isolated runtime database account and data must be retained.

## Verification

`npx tsx --test tests/access-policy.test.ts`
`npx tsc --noEmit`
`npm run build`
`node tests/http-security.mjs`

Runtime smoke is local-only, fake test credentials, no DB writes or provider sends. Root operator owns production rollout and live verification. Keep production stopped until protected runtime authentication values are present and anonymous access is proven denied.

## Remaining limitations

HTTP Basic is single-account, no MFA/session logout/account lockout. Keep high-entropy credentials protected and use HTTPS only. Website signup still needs anti-abuse/rate limiting and affirmative consent UX before it is a marketing-consent source. Legacy email delivery needs signed tracking/unsubscribe, signed webhook verification, conservative suppression checks, reliable dispatch/cancellation and approval workflow before any re-enable. Settings form is an inherited non-persistent mock, not a credential provisioning interface. Historical credentials in Git require rotation wherever reused; do not expose them.
