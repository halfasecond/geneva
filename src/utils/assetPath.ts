/// <reference types="vite/client" />

const { VITE_APP, VITE_APP_CDN_URL } = import.meta.env

const CDN = VITE_APP_CDN_URL || 'https://cdn.halfasecond.com/images/'

export const getAssetPath = (path: string): string => {
  return `${CDN}${VITE_APP}/${path}`;
};