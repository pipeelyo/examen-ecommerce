import { getAdminToken, getDemoToken } from '@/modules/auth/session'
import { mocksReady } from '@/mocks/ready'
import type { ApiErrorDto } from '@/shared/types'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorDto

  constructor(status: number, body: ApiErrorDto) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function apiBase(): string {
  if (import.meta.env.VITE_USE_MOCKS === 'true') return ''
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

function needsAuth(path: string, method: string): boolean {
  if (path.includes('/checkout/preview')) return false
  if (method === 'POST' && path.endsWith('/checkout')) return true
  if (path.includes('/orders/')) return true
  return false
}

function needsAdminToken(path: string, method: string): boolean {
  if (path.startsWith('/api/v1/products')) {
    return method === 'POST' || method === 'PATCH' || method === 'DELETE'
  }
  if (path.startsWith('/api/v1/coupons')) {
    // /api/v1/coupons (bare) es admin en GET (listar todo) y POST (crear);
    // /api/v1/coupons/available y /api/v1/coupons/:code siguen publicos.
    if (path === '/api/v1/coupons') return true
    return method === 'PATCH' || method === 'DELETE'
  }
  if (path.startsWith('/api/v1/admin/audit')) return true
  return false
}

async function waitForMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  await Promise.race([
    mocksReady,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 3000)
    }),
  ])
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  await waitForMocks()

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const method = (init.method ?? 'GET').toUpperCase()
  const token = getDemoToken()
  if (token && needsAuth(path, method)) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (needsAdminToken(path, method)) {
    const adminToken = getAdminToken()
    if (adminToken) headers.set('X-Admin-Token', adminToken)
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers })
  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      throw new ApiError(response.status, { code: 'UNKNOWN', message: 'Invalid JSON' })
    }
  }

  if (!response.ok) {
    const body: ApiErrorDto =
      data && typeof data === 'object' && 'code' in data && 'message' in data
        ? (data as ApiErrorDto)
        : { code: 'UNKNOWN', message: response.statusText }
    throw new ApiError(response.status, body)
  }

  return data as T
}
