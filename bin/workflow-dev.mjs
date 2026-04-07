#!/usr/bin/env node
/**
 * Workflow Dev Runner
 *
 * Usage:
 *   workflow-dev <workflow-file> [context-json]
 *   workflow-dev src/default_workflow.ts '{"task":"test","params":{}}'
 *
 * This script:
 * 1. Loads a workflow file using tsx (TypeScript execution)
 * 2. Uses the local version of workflow-sdk (connects to localhost:9222)
 * 3. Calls the execute function with the provided or default context
 */

import { pathToFileURL } from 'url';
import { resolve } from 'path';
import json5 from 'json5';

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

const resolvedPath = resolve(process.cwd(), workflowPath);

console.log(`Loading workflow: ${resolvedPath}`);
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

async function main() {
  try {
    // Dynamic import of workflow file
    // tsx handles TypeScript compilation and module resolution
    await import(pathToFileURL(resolvedPath).href);

    // Wait for module to initialize (workflows set globalThis.execute)
    await new Promise(r => setTimeout(r, 100));

    // Get the execute function from globalThis
    const execute = globalThis.execute;

    if (!execute) {
      console.error('Error: Workflow does not define execute function on globalThis');
      console.error('Make sure your workflow file has: globalThis.execute = execute;');
      process.exit(1);
    }

    console.log('Context:', JSON.stringify(context, null, 2));
    console.log('');
    console.log('Executing workflow...\n');

    const result = await execute(context);

    console.log('\nResult:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('\n✓ Workflow completed successfully');
    } else {
      console.log('\n✗ Workflow failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message || error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();