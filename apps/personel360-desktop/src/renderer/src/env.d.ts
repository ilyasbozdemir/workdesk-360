/// <reference types="vite/client" />
import type { PersonelApi } from '../../preload/index'

declare global {
  interface Window {
    api: PersonelApi
  }
}
