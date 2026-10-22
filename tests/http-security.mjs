import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
const port = 3187
const env = { ...process.env, SELFETAPE_ADMIN_USER: 'test-admin', SELFETAPE_ADMIN_PASSWORD: 'test-only-credential-not-production-123456789', SELFETAPE_PUBLIC_ORIGIN: 'https://crm.example.test', SELFETAPE_SIGNUP_TOKEN: 'test-only-signup-capability-not-production-123456789' }
// Test credentials exist only in this test process and its child; never production values.
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env, stdio: 'ignore' })
const auth = 'Basic ' + Buffer.from(`${env.SELFETAPE_ADMIN_USER}:${env.SELFETAPE_ADMIN_PASSWORD}`).toString('base64')
const base = `http://127.0.0.1:${port}`
let count = 0
async function check(path, status, options = {}) {
  const res = await fetch(base + path, { redirect: 'manual', ...options })
  assert.equal(res.status, status, `${options.method || 'GET'} ${path}`)
  await res.arrayBuffer(); count++
}
try {
  let ready = false
  for (let i = 0; i < 100; i++) {
    try { await fetch(base); ready = true; break } catch { await new Promise(r => setTimeout(r, 100)) }
  }
  assert.ok(ready, 'server started')
  for (const path of ['/', '/api/contacts', '/api/contacts/export', '/api/contacts/search?email=test@example.test', '/api/templates', '/contacts', '/contacts.csv', '/_next/image?url=%2Ffavicon.ico&w=64&q=75', '/campaigns?_rsc=123']) {
    await check(path, 401)
    await check(path, 401, { headers: { 'x-middleware-subrequest': 'src/proxy:src/proxy:src/proxy:src/proxy:src/proxy', 'x-middleware-skip': '1', rsc: '1' } })
  }
  await check('/api/contacts', 401, { method: 'POST', body: '{}' })
  await check('/api/contacts', 403, { method: 'POST', headers: { authorization: auth, origin: 'https://evil.test' }, body: '{}' })
  await check('/api/contacts', 403, { method: 'POST', headers: { authorization: auth }, body: '{}' })
  await check('/api/campaigns/a/send', 503, { method: 'POST', headers: { authorization: auth } })
  await check('/api/campaigns/a/test', 503, { method: 'POST', headers: { authorization: auth } })
  await check('/api/cron/send-scheduled', 503)
  await check('/api/webhooks/sendgrid', 503, { method: 'POST', body: '[]' })
  await check('/api/track/click/a?url=https://evil.test', 503)
  await check('/api/unsubscribe/a', 503)
  await check('/settings', 200, { headers: { authorization: auth } })
  const signup = { authorization: `Bearer ${env.SELFETAPE_SIGNUP_TOKEN}`, 'content-type': 'application/json' }
  await check('/api/website-signups', 405)
  await check('/api/website-signups', 401, { method: 'POST' })
  await check('/api/website-signups', 400, { method: 'POST', headers: signup, body: '{' })
  await check('/api/website-signups', 400, { method: 'POST', headers: signup, body: JSON.stringify({ email: 'invalid' }) })
  await check('/api/website-signups', 413, { method: 'POST', headers: signup, body: 'x'.repeat(5000) })
  await check('/api/contacts', 401, { headers: signup })
  console.log(`${count} production-server security assertions passed; no DB writes or sends.`)
} finally { child.kill('SIGTERM') }
