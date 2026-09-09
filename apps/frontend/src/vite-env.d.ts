/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: string
  readonly VITE_API_URL: string
  readonly VITE_ADMIN_API_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
