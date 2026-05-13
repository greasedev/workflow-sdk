import type { AgentContext } from '../../context'
import type { CompleteOptions, CompleteResult, JsonSchema } from '../../types'
import { completeSimple, getModel, Type, registerBuiltInApiProviders } from '@mariozechner/pi-ai'
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

  // Ensure API providers are registered
  registerBuiltInApiProviders()

  const modelId = process.env.LOCAL_MODEL ?? DEFAULT_MODEL
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL

  // Try to get model from registry, or create a basic model config if not found
  const baseModel = getModel('openai', modelId as never) as Model<Api> | undefined

  const model: Model<Api> = baseModel
    ? (baseUrl ? { ...baseModel, baseUrl } : baseModel)
    : {
        id: modelId,
        name: modelId,
        api: 'openai-completions' as Api,
        provider: 'openai',
        baseUrl: baseUrl ?? 'https://api.openai.com/v1',
        reasoning: false,
        input: ['text'] as ('text' | 'image')[],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 16384,
      }

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