#!/usr/bin/env node
/**
 * Page Build Tool
 *
 * Usage:
 *   page-build [src-dir] [dist-dir]
 *   page-build src/pages dist/pages
 *
 * This script:
 * 1. Loads .env file from current working directory
 * 2. Finds all *.html files in src-dir
 * 3. Uses Vite with vite-plugin-singlefile to inline all assets (JS, CSS)
 * 4. Outputs single HTML files to dist-dir
 *
 * Environment Variables:
 *   CDP_BASE_URL      - Chrome DevTools Protocol base URL (default: http://localhost:9222/json/api)
 */

import { build } from 'vite';
import { readdirSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, parse, resolve } from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
const distDir = resolve(process.cwd(), process.argv[3] || 'dist/pages');

console.log(`Building pages...`);
console.log(`  Source: ${srcDir}`);
console.log(`  Output: ${distDir}`);
console.log('');

// Create dist directory if not exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Clean dist
if (existsSync(distDir)) {
  for (const f of readdirSync(distDir)) {
    const filePath = join(distDir, f);
    try {
      rmSync(filePath, { recursive: true });
    } catch (e) {
      // Ignore errors
    }
  }
}

// Find all HTML files
const files = readdirSync(srcDir).filter(f => f.endsWith('.html'));

if (files.length === 0) {
  console.log('No HTML files found (*.html)');
  process.exit(0);
}

for (const file of files) {
  const srcPath = join(srcDir, file);
  const { name } = parse(file);
  const outPath = join(distDir, file);

  // Build with Vite + singlefile plugin
  await build({
    root: srcDir,
    base: './',
    define: {
      // Replace process.env.CDP_BASE_URL for browser environment
      'process.env.CDP_BASE_URL': JSON.stringify(process.env.CDP_BASE_URL || 'http://localhost:9222/json/api'),
      // Replace process.env.AGENT_ID for browser environment
      'process.env.AGENT_ID': JSON.stringify(process.env.AGENT_ID || '')
    },
    logLevel: 'warn',
    build: {
      outDir: resolve(process.cwd(), `dist/pages-temp/${name}`),
      emptyOutDir: true,
      minify: false,
      write: true,
      rollupOptions: {
        input: srcPath,
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      }
    },
    plugins: [
      viteSingleFile({
        removeInlinedFiles: true,
        useRecommendedBuildConfig: true
      })
    ]
  });

  // Move the output file to the correct location
  const tempOutPath = join(resolve(process.cwd(), `dist/pages-temp/${name}`), file);
  if (existsSync(tempOutPath)) {
    const htmlContent = readFileSync(tempOutPath, 'utf-8');
    writeFileSync(outPath, htmlContent);
    rmSync(resolve(process.cwd(), `dist/pages-temp/${name}`), { recursive: true });
  }

  console.log(`  ✓ ${outPath}`);
}

// Clean temp directory
if (existsSync(resolve(process.cwd(), 'dist/pages-temp'))) {
  rmSync(resolve(process.cwd(), 'dist/pages-temp'), { recursive: true });
}

console.log(`\n⚡ Built ${files.length} page(s)`);