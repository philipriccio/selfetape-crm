import test from 'node:test'
import assert from 'node:assert/strict'
import { authorize } from '../src/lib/access-policy'
const env = { ...process.env }
const password = 'test-only-random-value-not-a-real-credential-1234'
process.env.SELFETAPE_ADMIN_USER = 'test-admin'
process.env.SELFETAPE_ADMIN_PASSWORD = password
process.env.SELFETAPE_PUBLIC_ORIGIN = 'https://crm.example.test'
process.env.SELFETAPE_SIGNUP_TOKEN = 'test-only-scoped-signup-token-not-production-123'
const valid = () => new Headers({ authorization: `Basic ${Buffer.from(`test-admin:${password}`).toString('base64')}` })
test('every private route requires authentication, irrespective of fake bypass headers', () => {
  for (const path of ['/', '/api/contacts', '/api/contacts/export', '/contacts.csv', '/_next/data/test/contacts.json', '/_next/image', '/api/templates', '/campaigns']) {
    const h = new Headers({ 'x-middleware-subrequest': 'src/proxy:src/proxy:src/proxy:src/proxy:src/proxy', 'x-authenticated-user': 'test-admin', rsc: '1' })
    assert.equal(authorize(h, 'GET', path)?.status, 401)
    assert.equal(authorize(valid(), 'GET', path), null)
  }
})
test('missing or short configuration fails closed even with matching credentials', () => {
  delete process.env.SELFETAPE_ADMIN_PASSWORD
  assert.equal(authorize(valid(), 'GET', '/')?.status, 503)
  process.env.SELFETAPE_ADMIN_PASSWORD = password
})
test('CSRF protections require trusted origin for mutations', () => {
  const h = valid()
  assert.equal(authorize(h, 'POST', '/api/contacts')?.status, 403)
  h.set('origin', 'https://evil.test')
  assert.equal(authorize(h, 'DELETE', '/api/contacts/123')?.status, 403)
  h.set('origin', 'https://crm.example.test')
  assert.equal(authorize(h, 'POST', '/api/contacts'), null)
  h.set('sec-fetch-site', 'cross-site')
  assert.equal(authorize(h, 'POST', '/api/contacts')?.status, 403)
})
test('delivery remains disabled even for admin', () => {
  for (const path of ['/api/cron/send-scheduled', '/api/webhooks/sendgrid', '/api/track/click/a', '/api/unsubscribe/a', '/api/campaigns/a/send', '/api/campaigns/a/test'])
    assert.equal(authorize(valid(), 'POST', path)?.status, 503)
})
test('signup capability cannot authenticate admin or read any contacts', () => {
  const h = new Headers({ authorization: `Bearer ${process.env.SELFETAPE_SIGNUP_TOKEN}` })
  assert.equal(authorize(h, 'POST', '/api/website-signups'), null)
  assert.equal(authorize(h, 'GET', '/api/website-signups')?.status, 405)
  assert.equal(authorize(h, 'GET', '/api/contacts')?.status, 401)
  assert.equal(authorize(h, 'POST', '/api/contacts')?.status, 401)
  assert.equal(authorize(valid(), 'POST', '/api/website-signups')?.status, 401)
  delete process.env.SELFETAPE_SIGNUP_TOKEN
  assert.equal(authorize(h, 'POST', '/api/website-signups')?.status, 503)
})
test.after(() => { process.env = env })
