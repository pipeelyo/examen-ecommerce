import { type FormEvent, useEffect, useId, useState } from 'react'
import { getCategories, type CatalogCategory } from '@/shared/api/commerce'
import type { CouponDto, CouponScope } from '@/shared/types'
import { Button } from '@/shared/ui/Button'
import { Field, FieldActions, FieldAlert } from '@/shared/ui/Field'

export interface CouponDraft {
  code: string
  label: string
  scope: CouponScope
  categoryName: string
  discountPercent: number
  validFrom: string
  validTo: string
}

interface CouponFormFieldsProps {
  coupon?: CouponDto
  onCancel: () => void
  onSave: (draft: CouponDraft) => void
}

export function CouponFormFields({ coupon, onCancel, onSave }: CouponFormFieldsProps) {
  const codeId = useId()
  const labelId = useId()
  const scopeId = useId()
  const categoryId = useId()
  const discountId = useId()
  const fromId = useId()
  const toId = useId()
  const errorId = useId()

  const [code, setCode] = useState(coupon?.code ?? '')
  const [label, setLabel] = useState(coupon?.label ?? '')
  const [scope, setScope] = useState<CouponScope>(coupon?.scope ?? 'GLOBAL')
  const [categoryName, setCategoryName] = useState(coupon?.categoryName ?? '')
  const [discountPercent, setDiscountPercent] = useState(coupon ? String(coupon.discountPercent) : '10')
  const [validFrom, setValidFrom] = useState(coupon?.validFrom?.slice(0, 10) ?? '')
  const [validTo, setValidTo] = useState(coupon?.validTo?.slice(0, 10) ?? '')
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [error, setError] = useState<string | null>(null)

  const editing = coupon !== undefined

  useEffect(() => {
    void getCategories()
      .then((rows) => {
        setCategories(rows)
        if (!editing) setCategoryName((current) => current || rows[0]?.name || '')
      })
      .catch(() => setError('No se pudieron cargar las categorías'))
  }, [editing])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextCode = code.trim().toUpperCase()
    const nextLabel = label.trim()
    const nextDiscount = Number(discountPercent)
    if (!editing && !nextCode) {
      setError('El código es obligatorio')
      return
    }
    if (!nextLabel) {
      setError('La etiqueta es obligatoria')
      return
    }
    if (!Number.isFinite(nextDiscount) || nextDiscount <= 0 || nextDiscount > 100) {
      setError('El descuento debe estar entre 1 y 100')
      return
    }
    if (scope === 'CATEGORY' && !categoryName) {
      setError('Elige una categoría para el alcance')
      return
    }
    if (validFrom && validTo && validFrom > validTo) {
      setError('La vigencia inicial no puede ser posterior a la final')
      return
    }
    onSave({
      code: nextCode,
      label: nextLabel,
      scope,
      categoryName: scope === 'CATEGORY' ? categoryName : '',
      discountPercent: nextDiscount,
      validFrom,
      validTo,
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        id={codeId}
        name="code"
        label="Código"
        required
        disabled={editing}
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        autoComplete="off"
        hint={editing ? 'El código no se puede cambiar una vez creado.' : undefined}
      />
      <Field
        id={labelId}
        name="label"
        label="Etiqueta"
        required
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="15% en toda la compra"
        autoComplete="off"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <label htmlFor={scopeId} className="type-kicker">
            Alcance
          </label>
          <select
            id={scopeId}
            name="scope"
            required
            disabled={editing}
            className="field"
            value={scope}
            onChange={(event) => setScope(event.target.value as CouponScope)}
          >
            <option value="GLOBAL">Todo el catálogo</option>
            <option value="CATEGORY">Una categoría</option>
          </select>
          {editing ? <p className="type-caption mt-1.5">El alcance no se puede cambiar una vez creado.</p> : null}
        </div>
        {scope === 'CATEGORY' ? (
          <div className="min-w-0">
            <label htmlFor={categoryId} className="type-kicker">
              Categoría
            </label>
            <select
              id={categoryId}
              name="categoryName"
              required
              disabled={editing}
              className="field"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
            >
              {categories.length === 0 ? <option value="">Cargando…</option> : null}
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <Field
        id={discountId}
        name="discountPercent"
        label="Descuento %"
        type="number"
        min="1"
        max="100"
        step="1"
        required
        value={discountPercent}
        onChange={(event) => setDiscountPercent(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          id={fromId}
          name="validFrom"
          label="Vigente desde"
          type="date"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
          hint="Vacío = desde ya"
        />
        <Field
          id={toId}
          name="validTo"
          label="Vigente hasta"
          type="date"
          value={validTo}
          onChange={(event) => setValidTo(event.target.value)}
          hint="Vacío = sin vencimiento"
        />
      </div>
      {error ? <FieldAlert id={errorId}>{error}</FieldAlert> : null}
      <FieldActions>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{editing ? 'Guardar cambios' : 'Crear cupón'}</Button>
      </FieldActions>
    </form>
  )
}
