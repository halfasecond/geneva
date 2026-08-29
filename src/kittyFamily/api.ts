const strip = (value: string) => value.replace(/\/$/, '')

export const API = strip(String(import.meta.env.VITE_APP_ENDPOINT || ''))

export const CK_API = 'https://api.cryptokitties.co/v3'
