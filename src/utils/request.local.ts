import type { AgentContext } from '../context'
import type { WorkflowSDKError } from '../errors'

type ErrorConstructor = new (
  message: string,
  statusCode?: number,
) => WorkflowSDKError

export interface WorkflowRequestMessage {
  type: 'WORKFLOW_REQUEST'
  endpoint: string
  body: Record<string, unknown>
}

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

  // Mock implementation - returns simulated response
  console.log(`[MOCK] request: endpoint="${endpoint}", body=${JSON.stringify(body)}`)

  return { mocked: true, endpoint } as T
}