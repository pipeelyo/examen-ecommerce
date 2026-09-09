import { getSupabaseClient } from '@/shared/supabase/client'

export interface GoogleSession {
  email: string
  name: string
  accessToken: string
}

export function isGoogleLoginAvailable(): boolean {
  return getSupabaseClient() !== null
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Login con Google no está configurado en este entorno')
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOutOfGoogle(): Promise<void> {
  await getSupabaseClient()?.auth.signOut()
}

/**
 * Se suscribe una vez al estado de sesion de Supabase Auth. Cubre tanto el
 * regreso del redirect de OAuth (Supabase detecta la sesion en la URL al
 * cargar) como una sesion ya persistida en una visita anterior. Devuelve un
 * no-op si Google login no esta configurado (ver getSupabaseClient), para
 * que llamarlo sea seguro en cualquier entorno (incluidos los tests).
 */
export function subscribeToGoogleSession(onSignedIn: (session: GoogleSession) => void): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => undefined

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) return
    onSignedIn({
      email: session.user.email ?? '',
      name: (session.user.user_metadata.full_name as string | undefined) ?? session.user.email ?? 'Cliente',
      accessToken: session.access_token,
    })
  })

  return () => data.subscription.unsubscribe()
}
