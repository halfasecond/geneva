const strip = (value: string) => value.replace(/\/$/, '')

export const API = strip(String(import.meta.env.VITE_APP_ENDPOINT || ''))

/** News uses VITE_CDN_URL; Geneva apps use VITE_APP_CDN_URL (often .../images/). */
export const CDN = strip(
    String(import.meta.env.VITE_CDN_URL || import.meta.env.VITE_APP_CDN_URL || 'https://cdn.halfasecond.com').replace(
        /\/images\/?$/,
        '',
    ),
)

export const MEDIA = strip(String(import.meta.env.VITE_MEDIA_SERVER || 'https://hls.halfasecond.com'))
