import type { AgentContext } from '../../context'
import type { CompleteOptions, CompleteResult } from '../../types'

export async function complete(
  ctx: AgentContext,
  prompt: string,
  options?: CompleteOptions,
): Promise<CompleteResult> {
  ctx.throwIfAborted()

  // Mock implementation - returns simulated completion
  return {
    text: `[MOCK] Completion for prompt: "${prompt}"${options?.system ? ` (system: "${options.system}")` : ''}`,
  }
}