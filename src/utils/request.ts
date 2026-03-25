import type { AgentContext } from '../context'
import { ConnectionError } from '../errors'
import type { WorkflowSDKError } from '../errors'

type ErrorConstructor = new (
  message: string,
  statusCode?: number,
) => WorkflowSDKError

/**
 * Request message sent to background service worker
 */
export interface WorkflowRequestMessage {
  type: 'WORKFLOW_REQUEST'
  endpoint: string
  body: Record<string, unknown>
}

/**
 * Response from background service worker
 */
export interface WorkflowResponse<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: { message: string }
}

export async function request<T>(
  ctx: AgentContext,
  endpoint: string,
  body: Record<string, unknown>,
  ErrorClass: ErrorConstructor,
): Promise<T> {
  ctx.throwIfAborted()

  let response: WorkflowResponse<T>
  try {
    const result = await chrome.runtime.sendMessage({
      type: 'WORKFLOW_REQUEST',
      endpoint,
      body,
    } as WorkflowRequestMessage)

    response = result as WorkflowResponse<T>
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Operation aborted')
    }
    throw new ConnectionError(
      `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
      endpoint,
    )
  }

  if (!response.ok) {
    const errorMessage = response.error?.message ?? `Request failed with status ${response.status}`
    throw new ErrorClass(errorMessage, response.status)
  }

  return response.data as T
}