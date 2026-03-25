import type { AgentContext } from '../context'
import { CompletionError } from '../errors'
import type { CompleteOptions, CompleteResult } from '../types'
import { request } from '../utils/request'

export async function complete(
  ctx: AgentContext,
  prompt: string,
  options?: CompleteOptions,
): Promise<CompleteResult> {

  const result = await request<CompleteResult>(
    ctx,
    '/sdk/complete',
    {
      prompt,
      system: options?.system,
      context: options?.context,
    },
    CompletionError,
  )

  return result
}