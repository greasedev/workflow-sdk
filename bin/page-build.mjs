#!/usr/bin/env node
/**
 * Page Build Tool
 *
 * Usage:
 *   page-build [src-dir] [dist-dir]
 *   page-build src/pages dist/pages
 *
 * This script:
 * 1. Finds all *.html files in src-dir
 * 2. Uses Vite with vite-plugin-singlefile to inline all assets (JS, CSS)
 * 3. Outputs single HTML files to dist-dir
 */

import { build } from 'vite';
import { readdirSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, parse, resolve } from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

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