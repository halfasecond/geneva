/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP?: string
  readonly VITE_APP_CDN_URL?: string
  readonly VITE_APP_ENDPOINT?: string
  readonly VITE_APP_CONTRACT_PURR?: string
  readonly VITE_APP_CONTRACT_PURR_CLAIM?: string
  readonly VITE_APP_CONTRACT_PURR_CLAIM2?: string
  readonly VITE_APP_CONTRACT_CRYPTOKITTIES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
