import { requireApiAccess } from '@/lib/api-access'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const denied = await requireApiAccess('GET', '/api/campaigns')
  if (denied) return denied

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campaigns)
}

export async function POST(request: NextRequest) {
  const denied = await requireApiAccess('POST', '/api/campaigns')
  if (denied) return denied

  const body = await request.json()
  
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      subject: body.subject,
      fromName: body.fromName || 'The Self-e-Tape',
      fromEmail: body.fromEmail || 'philip@selfetape.ca',
      previewText: body.previewText || null,
      content: body.content,
      status: 'DRAFT',
    },
  })
  
  return NextResponse.json(campaign)
}
