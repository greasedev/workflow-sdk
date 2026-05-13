import type { AgentContext } from '../../context'
import type { CompleteOptions, CompleteResult, JsonSchema } from '../../types'
import { completeSimple, getModel, Type } from '@mariozechner/pi-ai'
import type { Tool, Model, Api } from '@mariozechner/pi-ai'

/**
 * Default model for LOCAL mode completions
 */
const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * Create the structured output tool for JSON schema responses.
 */
function createStructuredOutputTool(jsonSchema: JsonSchema): Tool {
  const schema = Type.Unsafe(jsonSchema)

  return {
    name: 'output_structured',
    description:
      'Output structured data. Call this tool to return the final result instead of plain text.',
    parameters: schema,
  }
}

/**
 * Process the result from completeSimple and return appropriate response.
 */
function processCompleteResult(
  result: { content: Array<{ type: string; text?: string; name?: string; arguments?: Record<string, unknown> }> },
  jsonSchema?: JsonSchema,
): CompleteResult {
  // If jsonSchema was provided, look for structured output tool call
  if (jsonSchema) {
    const toolCall = result.content.find(
      (c): c is { type: 'toolCall'; name: string; arguments: Record<string, unknown> } =>
        c.type === 'toolCall' && c.name === 'output_structured',
    )

    if (toolCall) {
      return { json: toolCall.arguments }
    }
  }

  // Standard text output
  const text = result.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map(c => c.text)
    .join('')

  return { text }
}

/**
 * Generate a text completion using pi-ai.
 *
 * Environment variables:
 * - OPENAI_API_KEY: Required for OpenAI provider
 * - OPENAI_BASE_URL: Optional, for custom API endpoint
 * - LOCAL_MODEL: Optional, defaults to 'gpt-4o-mini'
 */
export async function complete(
  ctx: AgentContext,
  prompt: string,
  options?: CompleteOptions,
): Promise<CompleteResult> {
  ctx.throwIfAborted()

  const modelId = process.env.LOCAL_MODEL ?? DEFAULT_MODEL
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL

  // Get base model from registry and override baseUrl if needed
  // Cast modelId to bypass strict typing - allows custom model names via LOCAL_MODEL env
  const baseModel = getModel('openai', modelId as never) as Model<Api>
  const model = baseUrl ? { ...baseModel, baseUrl } : baseModel

  const tools = options?.jsonSchema ? [createStructuredOutputTool(options.jsonSchema)] : undefined

  const result = await completeSimple(
    model,
    {
      systemPrompt: options?.system,
      messages: [{ role: 'user', content: prompt, timestamp: Date.now() }],
      tools,
    },
    apiKey ? { apiKey, maxTokens: 2000 } : { maxTokens: 2000 },
  )

  return processCompleteResult(result, options?.jsonSchema)
}