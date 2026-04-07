#!/usr/bin/env node
/**
 * Workflow Build Tool
 *
 * Usage:
 *   workflow-build [src-dir] [dist-dir]
 *   workflow-build src dist
 *
 * This script:
 * 1. Finds all *.workflow.ts files in src-dir
 * 2. Bundles each with esbuild (browser, IIFE format)
 * 3. Preserves frontmatter header in output
 * 4. Outputs to dist-dir
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync, mkdirSync } from 'fs';
import { join, parse, resolve } from 'path';

// Get command line arguments
const srcDir = resolve(process.cwd(), process.argv[2] || 'src');
const distDir = resolve(process.cwd(), process.argv[3] || 'dist');

console.log(`Building workflows...`);
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
    // Only remove files, not directories
    try {
      rmSync(filePath);
    } catch (e) {
      // Ignore errors for directories
    }
  }
}

// Find all workflow files
const files = readdirSync(srcDir).filter(f => f.endsWith('workflow.ts'));

if (files.length === 0) {
  console.log('No workflow files found (*.workflow.ts)');
  process.exit(0);
}

for (const file of files) {
  const srcPath = join(srcDir, file);
  const { name } = parse(file);
  const outPath = join(distDir, `${name}.js`);

  // 1. Extract frontmatter header
  const content = readFileSync(srcPath, 'utf-8');
  const match = content.match(/^(\/\*\*[\s\S]*?\*\/)/);
  const header = match ? match[1] : '';

  // 2. Compile with esbuild
  await esbuild.build({
    entryPoints: [srcPath],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: outPath,
    charset: 'utf8',
  });

  // 3. Prepend header
  if (header) {
    const jsContent = readFileSync(outPath, 'utf-8');
    writeFileSync(outPath, `${header}\n${jsContent}`);
  }

  console.log(`  ✓ ${outPath}`);
}

console.log(`\n⚡ Built ${files.length} workflow(s)`);