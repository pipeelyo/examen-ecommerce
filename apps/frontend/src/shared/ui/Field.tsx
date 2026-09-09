import { type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@/shared/lib/cn'

export function Field({
  label,
  hint,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : props['aria-describedby']

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={fieldId} className="type-kicker">
        {label}
      </label>
      <input id={fieldId} aria-describedby={hintId} {...props} className="field" />
      {hint ? (
        <p id={`${fieldId}-hint`} className="type-caption mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FieldSet({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="type-kicker">{legend}</legend>
      <div className="mt-2.5">{children}</div>
    </fieldset>
  )
}

export function CheckField({
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className={cn('field-check', className)}>
      <input type="checkbox" {...props} className="accent-copper size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </label>
  )
}

export function FieldAlert({
  children,
  tone = 'danger',
  role,
  id,
}: {
  children: ReactNode
  tone?: 'danger' | 'sage'
  role?: 'alert' | 'status'
  id?: string
}) {
  return (
    <p
      id={id}
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn('text-[0.9375rem] leading-snug', tone === 'sage' ? 'text-sage' : 'text-danger')}
    >
      {children}
    </p>
  )
}

export function FieldActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-3 pt-1">{children}</div>
}
