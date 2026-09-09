import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '@/app/App'

describe('login layers', () => {
  it('shows a real sign-in form before a session exists', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CUSTOMER' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ADMIN' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Piezas en sala' })).not.toBeInTheDocument()
  })

  it('preloads CUSTOMER and enters the sala', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'CUSTOMER' }))
    expect(await screen.findByRole('heading', { name: 'Piezas en sala' })).toBeInTheDocument()
  })

  it('rejects a wrong password', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Correo'), 'ana.rios@norte.shop')
    await user.type(screen.getByLabelText('Contraseña'), 'no-es')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
    expect(screen.queryByRole('heading', { name: 'Piezas en sala' })).not.toBeInTheDocument()
  })

  it('opens the buyer sala with the customer account', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'CUSTOMER' }))
    expect(await screen.findByRole('heading', { name: 'Piezas en sala' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Abrir bolsa/)).toBeInTheDocument()
    expect(screen.getByText('Ana Ríos')).toBeInTheDocument()
  })

  it('opens the admin taller with the staff account', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'ADMIN' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo y existencias' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Módulos de gestión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cupones' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bitácora' })).toBeInTheDocument()
    expect(screen.getByText('Iris Vega')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Abrir bolsa/)).not.toBeInTheDocument()
  })
})
