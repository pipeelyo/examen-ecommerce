import { type FormEvent, useEffect, useId, useState } from 'react'
import type { ProductDraft } from '@/mocks/catalogBook'
import { getCategories, type CatalogCategory } from '@/shared/api/commerce'
import type { ProductDto } from '@/shared/types'
import { Button } from '@/shared/ui/Button'
import { Field, FieldActions, FieldAlert, FieldSet } from '@/shared/ui/Field'
import { cn } from '@/shared/lib/cn'
import { iconForProduct, iconIdForCategory, PRODUCT_ICON_OPTIONS, type ProductIconId } from './productIcons'

interface ProductFormFieldsProps {
  product?: ProductDto
  onCancel: () => void
  onSave: (draft: ProductDraft) => void
}

export function ProductFormFields({ product, onCancel, onSave }: ProductFormFieldsProps) {
  const nameId = useId()
  const categoryId = useId()
  const priceId = useId()
  const stockId = useId()
  const errorId = useId()
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [icon, setIcon] = useState<ProductIconId>(
    product ? iconForProduct(product.id, product.category) : 'cpu',
  )
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getCategories()
      .then((rows) => {
        setCategories(rows)
        if (!product) {
          const first = rows[0]
          setCategory((current) => current || first?.name || '')
          if (first) setIcon((current) => (current === 'cpu' ? iconIdForCategory(first.name) : current))
        }
      })
      .catch(() => setError('No se pudieron cargar las categorías'))
  }, [product])

  function onCategoryChange(next: string) {
    setCategory(next)
    setIcon(iconIdForCategory(next))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextName = name.trim()
    const nextCategory = category.trim()
    const nextPrice = Number(price)
    const nextStock = Number(stock)
    if (!nextName) {
      setError('El nombre es obligatorio')
      return
    }
    if (!nextCategory) {
      setError('La categoría es obligatoria')
      return
    }
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError('El precio debe ser mayor que 0')
      return
    }
    if (!Number.isFinite(nextStock) || !Number.isInteger(nextStock) || nextStock < 0) {
      setError('El stock debe ser un entero de 0 o más')
      return
    }
    onSave({
      name: nextName,
      category: nextCategory,
      price: nextPrice,
      stock: nextStock,
      icon,
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        id={nameId}
        name="name"
        label="Nombre"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoComplete="off"
      />
      <div className="min-w-0">
        <label htmlFor={categoryId} className="type-kicker">
          Categoría
        </label>
        <select
          id={categoryId}
          name="category"
          required
          className="field"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          {categories.length === 0 ? <option value="">Cargando categorías…</option> : null}
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <FieldSet legend="Icono en el listado">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Icono en el listado">
          {PRODUCT_ICON_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cn(
                'btn-glass flex size-10 items-center justify-center rounded-full',
                icon === option.id && 'ring-2 ring-copper',
              )}
              aria-label={`Icono ${option.label}`}
              aria-pressed={icon === option.id}
              onClick={() => setIcon(option.id)}
            >
              <option.Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </FieldSet>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id={priceId}
          name="price"
          label="Precio USD"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Field
          id={stockId}
          name="stock"
          label="Stock"
          type="number"
          min="0"
          step="1"
          required
          value={stock}
          onChange={(event) => setStock(event.target.value)}
        />
      </div>
      {error ? <FieldAlert id={errorId}>{error}</FieldAlert> : null}
      <FieldActions>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{product ? 'Guardar cambios' : 'Crear pieza'}</Button>
      </FieldActions>
    </form>
  )
}
