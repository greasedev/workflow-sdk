import type { AgentContext } from '../context'
import { ConnectionError } from '../errors'
import type { SendTextResult, Visibility } from '../types'

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

  const response = await chrome.runtime.sendMessage({
    type: 'WORKFLOW_REQUEST',
    endpoint: '/sdk/send_text',
    body: { chatId, title, content, visibility },
  })

  if (!response || typeof response !== 'object') {
    throw new ConnectionError(
      `Invalid response from background`,
      '/sdk/send_text',
    )
  }

  const result = response as { ok: boolean; status: number; error?: { message: string } }

  if (!result.ok) {
    throw new SendTextError(
      result.error?.message ?? `Send text failed with status ${result.status}`,
      result.status,
    )
  }

  return { success: true }
}