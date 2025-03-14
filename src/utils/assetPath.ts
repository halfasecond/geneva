/// <reference types="vite/client" />

const { VITE_APP, VITE_APP_CDN_URL } = import.meta.env

export const getAssetPath = (path: string): string => {
  return `${VITE_APP_CDN_URL}${VITE_APP}/${path}`;
};