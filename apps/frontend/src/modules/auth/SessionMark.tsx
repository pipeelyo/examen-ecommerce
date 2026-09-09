import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/cn'
import { useAuthStore, type SessionRole } from './store'

const ROLE_VIEW: Record<SessionRole, { kicker: string; title: string; tone: string; photo: string }> = {
  CUSTOMER: { kicker: 'Sala', title: 'Cliente', tone: 'text-sage', photo: '/avatars/ana-rios.jpg' },
  ADMIN: { kicker: 'Taller', title: 'Admin', tone: 'text-copper', photo: '/avatars/iris-vega.jpg' },
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase() || '?'
}

export function SessionMark() {
  const name = useAuthStore((s) => s.name)
  const email = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)
  const view = role ? ROLE_VIEW[role] : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3.5 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-copper"
          aria-label={`Cuenta de ${name}`}
        >
          <span className="hidden min-w-0 max-w-[12rem] text-right sm:block sm:max-w-[16rem]">
            <span className="block truncate font-display text-[1.5rem] leading-none tracking-[-0.034em]">
              {name}
            </span>
            {view ? (
              <span className={cn('mt-2 block text-[0.9375rem] leading-none', view.tone)}>
                {view.kicker} · {view.title}
              </span>
            ) : null}
          </span>
          <Avatar className="size-16">
            {view ? <AvatarImage src={view.photo} alt="" /> : null}
            <AvatarFallback className="font-display text-[1.0625rem] tracking-wide">
              {initialsOf(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="p-2.5">
          <div className="flex items-start gap-3.5">
            <Avatar className="size-14 shrink-0">
              {view ? <AvatarImage src={view.photo} alt="" /> : null}
              <AvatarFallback className="font-display text-[0.9375rem]">{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 pt-0.5">
              <p className="w-full truncate font-display text-[1.25rem] leading-none tracking-[-0.03em] text-ink">
                {name}
              </p>
              {view ? (
                <p className={cn('text-[0.8125rem] leading-none', view.tone)}>
                  {view.kicker} · {view.title}
                </p>
              ) : null}
              <p className="w-full truncate text-[0.8125rem] leading-none text-muted">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1" />
        <DropdownMenuItem
          onSelect={() => logout()}
          className="justify-between px-3.5 py-2.5 text-danger focus:bg-danger/10 focus:text-danger"
        >
          Cerrar sesión
          <LogOut className="size-4" aria-hidden />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
