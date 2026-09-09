import { create } from 'zustand'
import { DEMO_BEARER } from '@/mocks/seed'
import type { GoogleSession } from './googleAuth'
import { signOutOfGoogle } from './googleAuth'
import type { SignInSuccess } from './signIn'

export type SessionRole = 'CUSTOMER' | 'ADMIN'

interface AuthState {
  role: SessionRole | null
  email: string
  name: string
  label: string
  /** Token real de Supabase (login Google) o el literal DEMO_BEARER (login por botones). */
  authToken: string | null
  applySession: (session: SignInSuccess) => void
  applyGoogleSession: (session: GoogleSession) => void
  enterBuyer: () => void
  enterAdmin: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  email: '',
  name: '',
  label: '',
  authToken: null,
  applySession: (session) =>
    set({
      role: session.role,
      email: session.email,
      name: session.name,
      label: session.label,
      authToken: DEMO_BEARER,
    }),
  // Todo usuario de Google entra como CUSTOMER — asignar ADMIN requiere la
  // tabla identity.user_roles del SDD (sdd/services/08-real-database-and-auth.md),
  // que todavia no esta conectada al login real.
  applyGoogleSession: (session) =>
    set({
      role: 'CUSTOMER',
      email: session.email,
      name: session.name,
      label: 'CUSTOMER',
      authToken: session.accessToken,
    }),
  enterBuyer: () =>
    set({
      role: 'CUSTOMER',
      email: 'ana.rios@norte.shop',
      name: 'Ana Ríos',
      label: 'CUSTOMER',
      authToken: DEMO_BEARER,
    }),
  enterAdmin: () =>
    set({
      role: 'ADMIN',
      email: 'iris.vega@norte.shop',
      name: 'Iris Vega',
      label: 'ADMIN',
      authToken: DEMO_BEARER,
    }),
  logout: () => {
    void signOutOfGoogle()
    set({ role: null, email: '', name: '', label: '', authToken: null })
  },
}))

export function getDemoToken(): string | null {
  return useAuthStore.getState().authToken
}

export function getAdminToken(): string | null {
  if (useAuthStore.getState().role !== 'ADMIN') return null
  return import.meta.env.VITE_ADMIN_API_TOKEN || 'dev-admin-token'
}
