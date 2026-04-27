#!/usr/bin/env node
/**
 * Page Dev Server
 *
 * Usage:
 *   page-dev [src-dir] [port]
 *   page-dev src/pages 3000
 *
 * This script:
 * 1. Starts Vite dev server for the pages directory
 * 2. Enables hot module replacement (HMR)
 * 3. Serves pages with TypeScript support
 */

import { createServer } from 'vite';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Get command line arguments
const srcDir = resolve(process.cwd(), process.argv[2] || 'src/pages');
const port = parseInt(process.argv[3] || '3000', 10);

if (!existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

console.log(`Starting dev server...`);
console.log(`  Source: ${srcDir}`);
console.log(`  Port: ${port}`);
console.log('');

// Create Vite dev server
const server = await createServer({
  root: srcDir,
  server: {
    port: port,
    open: true,
    host: true,
    proxy: {
      '/json/api': {
        target: 'http://localhost:9222',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/json\/api/, '/json/api')
      }
    }
  },
  resolve: {
    alias: {
      '@greaseclaw/workflow-sdk': resolve(process.cwd(), 'node_modules/@greaseclaw/workflow-sdk/dist/index.local.js')
    }
  },
  optimizeDeps: {
    include: ['@greaseclaw/workflow-sdk']
  }
});

await server.listen();

console.log(`\n✓ Dev server running at http://localhost:${port}`);
console.log('Press Ctrl+C to stop');

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});