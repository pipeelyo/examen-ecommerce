/// <reference path="./jest-dom.d.ts" />
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { afterEach, expect } from 'vitest'
import { useAuditBook } from '@/mocks/auditBook'
import { useCatalogBook } from '@/mocks/catalogBook'
import { useCouponBook } from '@/mocks/couponBook'
import { useCartStore } from '@/modules/cart/store'
import { useAuthStore } from '@/modules/auth/store'

// No usamos '@testing-library/jest-dom/vitest' directo: ese entrypoint hace
// `import {expect} from 'vitest'` desde la ubicacion de jest-dom, que npm
// hostea en la raiz del monorepo — ahi resuelve el vitest@3.2.7 de los
// servicios backend, no el vitest@4.1.11 anidado en este workspace, y los
// matchers quedan registrados en la instancia equivocada de `expect`.
expect.extend(matchers)

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: desktopMatchMedia,
})

function desktopMatchMedia(query: string) {
  return {
    matches: query.includes('min-width: 768px'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }
}

afterEach(() => {
  cleanup()
  useAuthStore.getState().logout()
  useCouponBook.getState().reset()
  useCatalogBook.getState().reset()
  useAuditBook.getState().reset()
  useCartStore.setState({ lines: {}, sheetOpen: false, pulse: null })
  window.location.hash = ''
  window.matchMedia = desktopMatchMedia
})
