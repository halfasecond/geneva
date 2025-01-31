import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // Use global variables like describe, it, expect
    environment: 'jsdom', // Use jsdom environment for React testing
    browser: {
        name: 'chromium',
        headless: true, // Run in headless mode
    },
    coverage: {
        reporter: ['text', 'html'],
        all: true, // Collect coverage for all files, even those not tested
        include: ['src/**/*.{js,ts,jsx,tsx}'], // Specify which files to include
        exclude: ['**/node_modules/**', '**/*.spec.{js,ts}', '**/*.ts', '**/*.test.tsx', '**/main.tsx'], // Specify files to exclude
    },
  }
})