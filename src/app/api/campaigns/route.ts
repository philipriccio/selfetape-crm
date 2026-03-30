import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campaigns)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      subject: body.subject,
      fromName: body.fromName || 'The Self-e-Tape',
      fromEmail: body.fromEmail || 'philip@selfetape.ca',
      previewText: body.previewText || null,
      content: body.content,
      status: body.status || 'DRAFT',
    },
  })
  
  return NextResponse.json(campaign)
}
