import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    name: 'node-tests',
    config: {
      test: {
        globals: true,
        environment: 'node', // ensures tests run in Node
        optimizeDeps: {
          exclude: ['express', 'safe-buffer', 'url', 'events', 'http', 'path', 'buffer'],
        },
        include: ['src/server/**/*.{test,spec}.{ts,js}'], // adjust as needed
      },
    },
  },
]);