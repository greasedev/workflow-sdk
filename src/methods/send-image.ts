import type { AgentContext } from '../context'
import { ConnectionError } from '../errors'
import type { SendImageResult, Visibility } from '../types'

/**
 * Error for sendImage operations
 */
export class SendImageError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'SendImageError'
  }
}

export async function sendImage(
  ctx: AgentContext,
  chatId: string,
  base64Image: string,
  visibility: Visibility = 'user',
): Promise<SendImageResult> {
  ctx.throwIfAborted()

  const response = await chrome.runtime.sendMessage({
    type: 'WORKFLOW_REQUEST',
    endpoint: '/sdk/send_image',
    body: { agentId: ctx.agentId, chatId, base64Image, visibility },
  })

  if (!response || typeof response !== 'object') {
    throw new ConnectionError(
      `Invalid response from background`,
      '/sdk/send_image',
    )
  }

  const result = response as { ok: boolean; status: number; error?: { message: string } }

  if (!result.ok) {
    throw new SendImageError(
      result.error?.message ?? `Send image failed with status ${result.status}`,
      result.status,
    )
  }

  return { success: true }
}