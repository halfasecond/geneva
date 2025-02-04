import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Copy .env to dist directory
const sourceEnv = resolve(rootDir, '.env');
const targetEnv = resolve(__dirname, 'dist', '.env');

try {
  copyFileSync(sourceEnv, targetEnv);
  console.log('✨ Copied .env to dist directory');
} catch (error) {
  console.error('❌ Error copying .env:', error.message);
  process.exit(1);
}