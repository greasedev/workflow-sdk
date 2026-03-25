# @greaseclaw/workflow-sdk

Browser automation SDK for GreaseClaw workflows - navigate, interact, extract data with natural language.

## Installation

```bash
npm install @greaseclaw/workflow-sdk
# or
pnpm add @greaseclaw/workflow-sdk
```

## Quick Start

```typescript
import type { Agent, WorkflowContext } from '@greaseclaw/workflow-sdk'

export async function execute(context: WorkflowContext) {
  const { agent, apis } = context

  // Navigate and interact with the browser
  await agent.act('click the login button')

  // Generate text completion
  const { text } = await agent.complete('Summarize the current page')

  // Call API endpoint
  const { data } = await agent.call('/api/users')

  return { success: true, text, data }
}
```

## Agent Methods

### `act(instruction, options?)`

Perform a browser action described in natural language.

```typescript
await agent.act('click the login button')
await agent.act('search for {{query}}', {
  context: { query: 'wireless headphones' }
})
```

### `complete(prompt, options?)`

Generate a text completion using the LLM.

```typescript
const { text } = await agent.complete('Summarize the current page')
```

### `call(endpoint, options?)`

Call an API endpoint.

```typescript
const { data } = await agent.call('/api/users')
const { data } = await agent.call('/api/users', {
  method: 'POST',
  body: { name: 'John' }
})
```

## Types

### `WorkflowContext<TApis>`

The context passed to workflow execute function.

```typescript
interface WorkflowContext<TApis = Record<string, unknown>> {
  agent: Agent
  apis: TApis
}
```

### `WorkflowApis`

Generated interface based on your API dependencies.

## License

AGPL-3.0-or-later