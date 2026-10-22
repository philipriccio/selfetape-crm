import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireApiAccess } from '@/lib/api-access'

export async function POST(request: NextRequest) {
  const denied = await requireApiAccess('POST', '/api/website-signups')
  if (denied) return denied
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return NextResponse.json({ error: 'JSON required' }, { status: 415 })
  const reader = request.body?.getReader()
  if (!reader) return NextResponse.json({ error: 'Body required' }, { status: 400 })
  let length = 0
  const chunks: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > 4096) {
        await reader.cancel()
        return NextResponse.json({ error: 'Body too large' }, { status: 413 })
      }
      chunks.push(value)
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'Invalid signup' }, { status: 400 })
    const { email, firstName, lastName, source, offer } = body
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        [firstName, lastName, source, offer].some(v => v !== undefined && (typeof v !== 'string' || v.length > 200)))
      return NextResponse.json({ error: 'Invalid signup' }, { status: 400 })
    const normalizedEmail = email.trim().toLowerCase()
    await prisma.$transaction(async tx => {
      const existing = await tx.contact.findFirst({ where: { email: { equals: normalizedEmail, mode: 'insensitive' } } })
      // Never disclose or change existing contacts, consent, suppression, or preferences.
      if (existing) return
      const contact = await tx.contact.create({ data: {
        email: normalizedEmail, firstName: firstName || null, lastName: lastName || null,
        fullName: [firstName, lastName].filter(Boolean).join(' ') || null,
        // Legacy website form does not collect affirmative marketing consent.
        solicitation: false,
        metadata: { signupSource: source || 'website', signupOffer: offer || '', receivedAt: new Date().toISOString(), consentStatus: 'not_verified' },
      } })
      for (const name of ['Waitlist', 'Website Signup']) {
        const tag = await tx.tag.upsert({ where: { name }, update: {}, create: { name } })
        await tx.contactTag.create({ data: { contactId: contact.id, tagId: tag.id } })
      }
    })
    return NextResponse.json({ success: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    // A simultaneous duplicate is also successful; never reveal whether a contact exists.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
      return NextResponse.json({ success: true }, { status: 202 })
    console.error('Website signup could not be stored')
    return NextResponse.json({ error: 'Signup unavailable' }, { status: 503 })
  }
}
