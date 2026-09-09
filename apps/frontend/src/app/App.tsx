import { LoginScreen } from '@/modules/auth/LoginScreen'
import { useAuthStore } from '@/modules/auth/store'
import { AdminShell } from '@/modules/admin/AdminShell'
import { Toaster } from '@/shared/ui/sonner'
import { BuyerShell } from './BuyerShell'

export function App() {
  const role = useAuthStore((s) => s.role)

  return (
    <>
      <Toaster />
      {role === null ? <LoginScreen /> : role === 'ADMIN' ? <AdminShell /> : <BuyerShell />}
    </>
  )
}
