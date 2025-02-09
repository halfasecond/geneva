/// <reference types="vite/client" />

/**
 * Helper function to get the correct asset path considering the base URL in production
 * @param path The asset path relative to the public directory
 * @returns The complete asset path including base URL if needed
 */
export const getAssetPath = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // In development, base is '/', in production it's '/geneva/'
  const base = import.meta.env.BASE_URL;
  return `${base}${cleanPath}`;
};