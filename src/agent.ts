import type { AgentContext } from './context'
import { WorkflowSDKError } from './errors'
import { act } from './methods/act'
import { call } from './methods/call'
import { complete } from './methods/complete'
import { request } from './utils/request'
import type {
  ActOptions,
  ActResult,
  AgentOptions,
  BrowserContext,
  CallOptions,
  CallResult,
  CompleteOptions,
  CompleteResult,
} from './types'

/**
 * Internal error class for dispose operations
 */
class DisposeError extends WorkflowSDKError {
  constructor(message: string, statusCode?: number) {
    super(message, 'DISPOSE_ERROR', statusCode)
    this.name = 'DisposeError'
  }
}

/**
 * Browser automation agent for GreaseClaw workflows.
 * Provides high-level methods to interact with browser and call APIs.
 *
 * @remarks
 * The Agent instance is injected by the runtime - never instantiate it directly.
 * Export a `run` function that receives the agent as a parameter.
 *
 * @example
 * ```typescript
 * import type { Agent } from '@greaseclaw/workflow-sdk'
 *
 * export async function run(agent: Agent) {
 *   await agent.act('click the login button')
 *   const { text } = await agent.complete('Summarize the page')
 *   const { data } = await agent.call('/api/users')
 *   return { message: 'Done', text, data }
 * }
 * ```
 */
export class Agent implements AsyncDisposable, AgentContext {
  readonly signal?: AbortSignal
  readonly browserContext?: BrowserContext
  readonly stateful: boolean

  private _sessionId: string | null = null
  private _disposed = false

  constructor(options: AgentOptions) {
    this.signal = options.signal
    this.browserContext = options.browserContext
    this.stateful = options.stateful ?? true

    if (this.stateful) {
      this._sessionId = crypto.randomUUID()
    }
  }

  get sessionId(): string | null {
    return this._sessionId
  }

  set sessionId(value: string | null) {
    this._sessionId = value
  }

  async dispose(): Promise<void> {
    if (this._disposed) return
    this._disposed = true

    if (this._sessionId) {
      try {
        await request<{ success: boolean }>(
          this,
          '/session/dispose',
          { sessionId: this._sessionId },
          DisposeError,
        )
      } catch {
        // Ignore dispose errors
      }
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose()
  }

  throwIfAborted(): void {
    if (this.signal?.aborted) {
      throw new Error('Operation aborted')
    }
  }

  /**
   * Perform a browser action described in natural language.
   *
   * @param instruction - Natural language description of the action
   * @param options - Optional action settings
   * @returns Promise resolving to `{ success: boolean, steps: ActStep[] }`
   * @throws {ActionError} When the action fails
   *
   * @example
   * ```typescript
   * await agent.act('click the login button')
   *
   * await agent.act('search for {{query}}', {
   *   context: { query: 'wireless headphones' }
   * })
   * ```
   */
  act(instruction: string, options?: ActOptions): Promise<ActResult> {
    return act(this, instruction, options)
  }

  /**
   * Generate a text completion using the LLM.
   *
   * @param prompt - The prompt to send to the LLM
   * @param options - Optional completion settings
   * @returns Promise resolving to `{ text: string }`
   * @throws {CompletionError} When completion fails
   *
   * @example
   * ```typescript
   * const { text } = await agent.complete('Summarize the current page')
   *
   * const { text } = await agent.complete('Analyze this data', {
   *   system: 'You are a data analyst'
   * })
   * ```
   */
  complete(prompt: string, options?: CompleteOptions): Promise<CompleteResult> {
    return complete(this, prompt, options)
  }

  /**
   * Call an API endpoint.
   *
   * @param endpoint - The API endpoint path (e.g., '/api/users')
   * @param options - Optional request settings
   * @returns Promise resolving to `{ data: T, status: number }`
   * @throws {CallError} When the request fails
   *
   * @example
   * ```typescript
   * // GET request
   * const { data } = await agent.call('/api/users')
   *
   * // POST request
   * const { data } = await agent.call('/api/users', {
   *   method: 'POST',
   *   body: { name: 'John' }
   * })
   *
   * // With query parameters
   * const { data } = await agent.call('/api/users', {
   *   query: { page: 1, limit: 10 }
   * })
   * ```
   */
  call<T = unknown>(endpoint: string, options?: CallOptions): Promise<CallResult<T>> {
    return call<T>(this, endpoint, options)
  }
}