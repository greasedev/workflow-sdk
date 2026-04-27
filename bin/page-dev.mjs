#!/usr/bin/env node
/**
 * Page Dev Server
 *
 * Usage:
 *   page-dev [src-dir] [port]
 *   page-dev src/pages 3000
 *
 * This script:
 * 1. Loads .env file from current working directory
 * 2. Starts Vite dev server for the pages directory
 * 3. Enables hot module replacement (HMR)
 * 4. Serves pages with TypeScript support
 *
 * Environment Variables:
 *   CDP_BASE_URL      - Chrome DevTools Protocol base URL (default: http://localhost:9222/json/api)
 */

import { createServer } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load .env file if exists
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Only set if not already defined
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
  console.log('Loaded .env file');
}

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
  define: {
    // Replace process.env.CDP_BASE_URL for browser environment
    // Default to dev server port which proxies to CDP
    'process.env.CDP_BASE_URL': JSON.stringify(process.env.CDP_BASE_URL || `http://localhost:${port}/json/api`),
    // Replace process.env.AGENT_ID for browser environment
    'process.env.AGENT_ID': JSON.stringify(process.env.AGENT_ID || '')
  },
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