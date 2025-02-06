import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      globals: true,
      environment: 'node',
      include: ['src/server/**/*.test.{ts,js}'],
      watch: false,
      coverage: {
        enabled: true,
        provider: 'v8',
        reporter: ['text', 'html'],
        include: [
          'src/server/github/**/*.ts',
          'src/server/services/**/*.ts'
        ],
        exclude: [
          '**/node_modules/**',
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/dist/**'
        ],
        all: true
      },
      deps: {
        external: ['express', 'supertest']
      },
      optimizeDeps: {
        exclude: ['express', 'supertest', 'safe-buffer', 'url', 'events', 'http', 'path', 'buffer']
      }
    }
  }
]);