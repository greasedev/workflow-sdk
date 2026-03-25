import type { AgentContext } from '../context'
import { ConnectionError } from '../errors'
import type { CallOptions, CallResult } from '../types'

/**
 * Error for call operations
 */
export class CallError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'CallError'
  }
}

export async function call<T>(
  ctx: AgentContext,
  endpoint: string,
  options?: CallOptions,
): Promise<CallResult<T>> {
  ctx.throwIfAborted()

  const response = await chrome.runtime.sendMessage({
    type: 'WORKFLOW_REQUEST',
    endpoint: '/sdk/call',
    body: {
      targetEndpoint: endpoint,
      method: options?.method ?? 'GET',
      headers: options?.headers,
      body: options?.body,
      query: options?.query,
    },
  })

  if (!response || typeof response !== 'object') {
    throw new ConnectionError(
      `Invalid response from background`,
      endpoint,
    )
  }

  const result = response as { ok: boolean; status: number; data?: T; error?: { message: string } }

  if (!result.ok) {
    throw new CallError(
      result.error?.message ?? `Request failed with status ${result.status}`,
      result.status,
    )
  }

  return {
    data: result.data as T,
    status: result.status,
  }
}