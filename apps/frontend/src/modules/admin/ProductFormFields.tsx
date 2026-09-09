import { type FormEvent, useId, useState } from 'react'
import { PRODUCT_CATEGORIES } from '@/mocks/seed'
import type { ProductDraft } from '@/mocks/catalogBook'
import type { ProductDto } from '@/shared/types'
import { Button } from '@/shared/ui/Button'
import { Field, FieldActions, FieldAlert } from '@/shared/ui/Field'

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
  const [category, setCategory] = useState(product?.category ?? 'Tecnología')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [error, setError] = useState<string | null>(null)

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
      <Field
        id={categoryId}
        name="category"
        label="Categoría"
        hint="Tecnología, Libros, Muebles, Hogar o Ropa"
        required
        list={`${categoryId}-list`}
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        autoComplete="off"
      />
      <datalist id={`${categoryId}-list`}>
        {PRODUCT_CATEGORIES.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
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
