import type { AgentContext } from '../../context'
import type { SendImageResult, Visibility } from '../../types'

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

  // Mock implementation - returns success
  console.log(`[MOCK] sendImage: agentId="${ctx.agentId}", chatId="${chatId}", imageLength=${base64Image.length}, visibility="${visibility}"`)
  return { success: true }
}