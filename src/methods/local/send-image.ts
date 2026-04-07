import type { AgentContext } from '../../context'
import type { SendImageResult } from '../../types'

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
): Promise<SendImageResult> {
  ctx.throwIfAborted()

  // Mock implementation - returns success
  console.log(`[MOCK] sendImage: chatId="${chatId}", imageLength=${base64Image.length}`)
  return { success: true }
}