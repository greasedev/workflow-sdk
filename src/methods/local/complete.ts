import type { AgentContext } from '../../context'
import type { CompleteOptions, CompleteResult } from '../../types'
import { generateText } from 'ai'
import { createOpenAI, openai } from '@ai-sdk/openai'

/**
 * Default model for LOCAL mode completions
 */
const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * Generate a text completion using Vercel AI SDK.
 *
 * Environment variables:
 * - OPENAI_API_KEY: Required for OpenAI provider
 * - OPENAI_BASE_URL: Optional, for custom API endpoint (e.g., Ollama, vLLM, DashScope)
 * - LOCAL_MODEL: Optional, defaults to 'gpt-4o-mini'
 */
export async function complete(
  ctx: AgentContext,
  prompt: string,
  options?: CompleteOptions,
): Promise<CompleteResult> {
  ctx.throwIfAborted()

  const model = process.env.LOCAL_MODEL ?? DEFAULT_MODEL
  const baseUrl = process.env.OPENAI_BASE_URL

  // Use chat completions API for better compatibility with OpenAI-compatible endpoints
  // (DashScope, Ollama, vLLM, etc.)
  const client = baseUrl
    ? createOpenAI({ baseURL: baseUrl })
    : openai

  const result = await generateText({
    model: client.chat(model),
    prompt,
    system: options?.system,
  })

  return {
    text: result.text,
  }
}