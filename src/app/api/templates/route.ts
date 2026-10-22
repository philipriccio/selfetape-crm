import { requireApiAccess } from '@/lib/api-access'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const denied = await requireApiAccess('GET', '/api/templates')
  if (denied) return denied

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  const denied = await requireApiAccess('POST', '/api/templates')
  if (denied) return denied

  const body = await request.json()
  
  const template = await prisma.template.create({
    data: {
      name: body.name,
      content: body.content,
      isDefault: body.isDefault || false,
    },
  })
  
  return NextResponse.json(template)
}
