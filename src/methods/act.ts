import type { AgentContext } from '../context'
import { ActionError } from '../errors'
import type { ActOptions, ActResult } from '../types'
import { request } from '../utils/request'

export async function act(
  ctx: AgentContext,
  instruction: string,
  options?: ActOptions,
): Promise<ActResult> {
  // Handle resetState on first call only
  if (options?.resetState && ctx.stateful) {
    ctx.sessionId = crypto.randomUUID()
  }


  // With verification: execute + verify + retry loop
  const maxRetries = options?.maxRetries ?? 1
  let lastResult: ActResult | null = null
  let lastVerifyReason: string | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // On retry, include the verification failure in the instruction
    const retryInstruction =
      attempt === 0 || !lastVerifyReason
        ? instruction
        : `${instruction}\n\n[Previous attempt failed verification: "${lastVerifyReason}"]`

    // Don't reset state on retries - let agent see previous context
    const attemptOptions =
      attempt === 0 ? options : { ...options, resetState: false }

    lastResult = await executeAct(ctx, retryInstruction, attemptOptions)

    // Action failed - no point verifying
    if (!lastResult.success) {
      return lastResult
    }

  }

  // All retries exhausted - verification failed
  return {
    success: false,
    steps: lastResult?.steps ?? [],
  }
}

async function executeAct(
  ctx: AgentContext,
  instruction: string,
  options?: ActOptions,
): Promise<ActResult> {
  ctx.throwIfAborted()

  const browserContextForAct = ctx.browserContext
    ? {
        windowId: ctx.browserContext.windowId,
        enabledMcpServers: ctx.browserContext.enabledMcpServers,
      }
    : undefined

  return request<ActResult>(ctx, '/sdk/act', {
    instruction,
    context: options?.context,
    maxSteps: options?.maxSteps,
    browserContext: browserContextForAct,
    sessionId: ctx.sessionId,
  }, ActionError)
}