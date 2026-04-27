import type { AgentContext } from '../../context'
import type { CallOptions, CallResult } from '../../types'

/**
 * Default API base URL for LOCAL mode
 * Can be overridden via CDP_BASE_URL environment variable
 */
const DEFAULT_API_BASE_URL = process.env.CDP_BASE_URL ?? 'http://localhost:9222/json/api'

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

  const method = options?.method ?? 'GET'
  const headers = options?.headers
  const requestBody = options?.body
  const query = options?.query

  // Build URL with base URL prefix if not absolute
  let url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${DEFAULT_API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(
      Object.entries(query).map(([k, v]) => [k, String(v)]),
    )
    url = `${url}?${params.toString()}`
  }

  const fetchOptions: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  }

  if (requestBody && method !== 'GET') {
    fetchOptions.body = JSON.stringify(requestBody)
  }

  const response = await fetch(url, fetchOptions)
  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new CallError(
      typeof data === 'object' && data && 'message' in data
        ? (data.message as string)
        : `Request failed with status ${response.status}`,
      response.status,
    )
  }

  return {
    data: data as T,
    status: response.status,
  }
}