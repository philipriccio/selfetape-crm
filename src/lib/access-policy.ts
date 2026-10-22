import { createHash, timingSafeEqual } from 'node:crypto'

function equal(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}
function denied(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    ...(status === 401 ? { 'WWW-Authenticate': 'Basic realm="SelfTape CRM", charset="UTF-8"' } : {}),
  } })
}
export function authorize(headers: Headers, method: string, path: string): Response | null {
  // No legacy unsigned delivery endpoints are public or operational.
  if (/^\/api\/(cron|webhooks|track|unsubscribe)(\/|$)/.test(path) ||
      /^\/api\/campaigns\/[^/]+\/(send|test)(\/|$)/.test(path)) return denied(503, 'Email delivery is disabled')
  if (path === '/api/website-signups') {
    const token = process.env.SELFETAPE_SIGNUP_TOKEN || ''
    if (token.length < 32) return denied(503, 'Signup unavailable')
    if (method !== 'POST') return denied(405, 'Method not allowed')
    if (!equal(headers.get('authorization') || '', `Bearer ${token}`)) return denied(401, 'Unauthorized')
    return null
  }
  const user = process.env.SELFETAPE_ADMIN_USER || ''
  const password = process.env.SELFETAPE_ADMIN_PASSWORD || ''
  const origin = process.env.SELFETAPE_PUBLIC_ORIGIN || ''
  if (!user || user.includes(':') || password.length < 32 || !/^https:\/\/[^/]+$/.test(origin))
    return denied(503, 'CRM authentication unavailable')
  const expected = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
  if (!equal(headers.get('authorization') || '', expected)) return denied(401, 'Unauthorized')
  // Basic credentials are ambient in browsers; require same-origin mutations.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) &&
      (headers.get('origin') !== origin || headers.get('sec-fetch-site') === 'cross-site'))
    return denied(403, 'Same-origin request required')
  return null
}
