import { create } from 'zustand'
import { DEMO_BEARER } from '@/mocks/seed'
import type { SignInSuccess } from './signIn'

export type SessionRole = 'CUSTOMER' | 'ADMIN'

interface AuthState {
  role: SessionRole | null
  email: string
  name: string
  label: string
  applySession: (session: SignInSuccess) => void
  enterBuyer: () => void
  enterAdmin: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  email: '',
  name: '',
  label: '',
  applySession: (session) =>
    set({
      role: session.role,
      email: session.email,
      name: session.name,
      label: session.label,
    }),
  enterBuyer: () =>
    set({
      role: 'CUSTOMER',
      email: 'ana.rios@norte.shop',
      name: 'Ana Ríos',
      label: 'CUSTOMER',
    }),
  enterAdmin: () =>
    set({
      role: 'ADMIN',
      email: 'iris.vega@norte.shop',
      name: 'Iris Vega',
      label: 'ADMIN',
    }),
  logout: () => set({ role: null, email: '', name: '', label: '' }),
}))

export function getDemoToken(): string | null {
  return useAuthStore.getState().role ? DEMO_BEARER : null
}

export function getAdminToken(): string | null {
  if (useAuthStore.getState().role !== 'ADMIN') return null
  return import.meta.env.VITE_ADMIN_API_TOKEN || 'dev-admin-token'
}
