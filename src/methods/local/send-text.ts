import type { AgentContext } from '../../context'
import type { SendTextResult, Visibility } from '../../types'

/**
 * Error for sendText operations
 */
export class SendTextError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'SendTextError'
  }
}

export async function sendText(
  ctx: AgentContext,
  chatId: string,
  title: string,
  content: string,
  visibility: Visibility = 'user',
): Promise<SendTextResult> {
  ctx.throwIfAborted()

  // Mock implementation - returns success
  console.log(`[MOCK] sendText: chatId="${chatId}", title="${title}", content="${content}", visibility="${visibility}"`)
  return { success: true }
}