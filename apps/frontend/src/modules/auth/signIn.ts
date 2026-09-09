import type { SessionRole } from './store'

export interface DemoAccount {
  email: string
  password: string
  role: SessionRole
  name: string
  label: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'ana.rios@norte.shop',
    password: 'sala2026',
    role: 'CUSTOMER',
    name: 'Ana Ríos',
    label: 'CUSTOMER',
  },
  {
    email: 'iris.vega@norte.shop',
    password: 'taller2026',
    role: 'ADMIN',
    name: 'Iris Vega',
    label: 'ADMIN',
  },
]

export interface SignInSuccess {
  ok: true
  email: string
  name: string
  label: string
  role: SessionRole
}

export interface SignInFailure {
  ok: false
  message: string
}

export function accountForRole(role: SessionRole): DemoAccount {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role)
  if (!account) throw new Error(`missing demo account for ${role}`)
  return account
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInSuccess | SignInFailure> {
  await new Promise((resolve) => window.setTimeout(resolve, 280))
  const normalized = email.trim().toLowerCase()
  const account = DEMO_ACCOUNTS.find((item) => item.email === normalized)
  if (!account || account.password !== password) {
    return { ok: false, message: 'Correo o contraseña incorrectos' }
  }
  return {
    ok: true,
    email: account.email,
    name: account.name,
    label: account.label,
    role: account.role,
  }
}
