import { NextRequest, NextResponse } from 'next/server'
import { authorize } from './lib/access-policy'

export function proxy(request: NextRequest) {
  const denied = authorize(request.headers, request.method, request.nextUrl.pathname)
  if (denied) return denied
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
// Deliberately includes static-looking suffixes, RSC, prefetch, and framework paths.
export const config = { matcher: '/:path*' }
