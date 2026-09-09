import { type FormEvent, useId, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field, FieldAlert, FieldSet } from '@/shared/ui/Field'
import { accountForRole, signInWithPassword } from './signIn'
import { useAuthStore } from './store'

export function LoginScreen() {
  const applySession = useAuthStore((s) => s.applySession)
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function enterWith(role: 'CUSTOMER' | 'ADMIN') {
    const account = accountForRole(role)
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
    setPending(true)
    const result = await signInWithPassword(account.email, account.password)
    setPending(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    applySession(result)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await signInWithPassword(email, password)
    setPending(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    applySession(result)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5 py-16">
      <p className="type-kicker">KataE1 - Ecommerce</p>
      <h1 className="type-hero mt-4">Inicia sesión</h1>
      <p className="type-lede">
        Roles IAM del SDD: <span className="text-ink">CUSTOMER</span> consulta catálogo y hace checkout;{' '}
        <span className="text-ink">ADMIN</span> gestiona productos y cupones, y consulta la bitácora.
      </p>
      <form onSubmit={(event) => void onSubmit(event)} className="glass mt-10 flex flex-col gap-5 rounded-[1.5rem] p-7 sm:p-8">
        <FieldSet legend="Entrar como">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => void enterWith('CUSTOMER')}>
              CUSTOMER
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => void enterWith('ADMIN')}>
              ADMIN
            </Button>
          </div>
        </FieldSet>
        <Field
          id={emailId}
          type="email"
          name="email"
          label="Correo"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Field
          id={passwordId}
          type="password"
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error ? <FieldAlert id={errorId}>{error}</FieldAlert> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
