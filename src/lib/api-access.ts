import { headers } from 'next/headers'
import { authorize } from './access-policy'

export async function requireApiAccess(method: string, path: string) {
  return authorize(new Headers(await headers()), method, path)
}
