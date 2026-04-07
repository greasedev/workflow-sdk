#!/usr/bin/env node
/**
 * Workflow Dev Runner
 *
 * Usage:
 *   workflow-dev <workflow-file> [context-json]
 *   workflow-dev src/default_workflow.ts '{"task":"test","params":{}}'
 *
 * This script:
 * 1. Creates a temporary tsconfig.json with SDK alias to local version
 * 2. Loads the workflow file using tsx with the custom tsconfig
 * 3. Calls the execute function with the provided or default context
 */

import { pathToFileURL, fileURLToPath } from 'url';
import { resolve, dirname, basename } from 'path';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdtempSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import json5 from 'json5';
import { spawn } from 'child_process';

// Get command line arguments
const workflowPath = process.argv[2];
const contextJson = process.argv[3];

if (!workflowPath) {
  console.error('Usage: workflow-dev <workflow-file> [context-json]');
  console.error('');
  console.error('Arguments:');
  console.error('  workflow-file  Path to workflow TypeScript file (e.g., src/default_workflow.ts)');
  console.error('  context-json   Optional JSON/JSON5 context for execute()');
  console.error('');
  console.error('Examples:');
  console.error('  workflow-dev src/default_workflow.ts');
  console.error('  workflow-dev src/default_workflow.ts \'{"task":"buy iPhone","params":{"city":"Beijing"}}\'');
  console.error('');
  console.error('Note: Requires Chrome DevTools Protocol at localhost:9222');
  process.exit(1);
}

const cwd = process.cwd();
const resolvedWorkflowPath = resolve(cwd, workflowPath);

console.log(`Loading workflow: ${resolvedWorkflowPath}`);
console.log('SDK mode: local (localhost:9222)');
console.log('');

// Default test context if not provided
const defaultContext = {
  task: 'Test workflow execution',
  chatId: 'test-chat-dev',
  params: {},
  agentOptions: {
    stateful: true
  }
};

// Parse context from command line or use default
let context;
if (contextJson) {
  try {
    context = json5.parse(contextJson);
  } catch (e) {
    console.error('Failed to parse context JSON:', e);
    console.error('Context must be valid JSON or JSON5');
    process.exit(1);
  }
} else {
  context = defaultContext;
  console.log('Using default test context. Provide context-json to customize.');
}

// Find workflow-sdk path by importing it and checking the URL
const sdkModuleUrl = await import.meta.resolve('@greaseclaw/workflow-sdk/local');
const sdkModulePath = fileURLToPath(sdkModuleUrl);
const sdkDistPath = dirname(sdkModulePath);

// Create temporary directory for tsconfig
const tempDir = mkdtempSync(resolve(tmpdir(), 'workflow-dev-'));

// Create temporary tsconfig.json with alias
const tempTsconfig = resolve(tempDir, 'tsconfig.json');
const tsconfigContent = {
  compilerOptions: {
    baseUrl: cwd,
    paths: {
      '@greaseclaw/workflow-sdk': [resolve(sdkDistPath, 'index.local.js')],
      '@greaseclaw/workflow-sdk/*': [resolve(sdkDistPath, '*')]
    }
  }
};
writeFileSync(tempTsconfig, JSON.stringify(tsconfigContent, null, 2));

// Create runner script that imports workflow and executes it
const runnerScript = resolve(tempDir, 'runner.mjs');
const runnerContent = `
import { pathToFileURL } from 'url';

// Store context in globalThis for runner to access
globalThis.__workflowContext = ${JSON.stringify(context)};

// Import the workflow file
await import(pathToFileURL('${resolvedWorkflowPath}').href);

// Wait for workflow to initialize
await new Promise(r => setTimeout(r, 100));

// Get execute function
const execute = globalThis.execute;
if (!execute) {
  console.error('Error: Workflow does not define execute function on globalThis');
  process.exit(1);
}

// Run workflow
const result = await execute(globalThis.__workflowContext);
console.log('\\nResult:', JSON.stringify(result, null, 2));

if (result && result.success) {
  console.log('\\n✓ Workflow completed successfully');
} else {
  console.log('\\n✗ Workflow failed');
  process.exit(1);
}
`;
writeFileSync(runnerScript, runnerContent);

// Find tsx CLI path - use absolute path since exports don't expose it
const tsxPackageDir = dirname(fileURLToPath(await import.meta.resolve('tsx')));
const tsxCliPath = resolve(tsxPackageDir, 'cli.mjs');

// Run tsx with custom tsconfig
const child = spawn(process.execPath, [
  tsxCliPath,
  '--tsconfig', tempTsconfig,
  runnerScript
], {
  stdio: 'inherit',
  cwd: cwd,
  env: { ...process.env }
});

child.on('close', (code) => {
  // Cleanup temp files
  try {
    unlinkSync(tempTsconfig);
    unlinkSync(runnerScript);
    try { rmdirSync(tempDir); } catch {}
  } catch {}

  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start workflow:', err);
  process.exit(1);
});