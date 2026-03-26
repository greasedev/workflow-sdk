import type { ZodSchema } from 'zod'

// ============================================================================
// Browser Context Types (embedded from shared)
// ============================================================================

/**
 * Tab information
 */
export interface Tab {
  id: number
  url?: string
  title?: string
  pageId?: number
}


/**
 * Browser context
 * Contains window, tab, and MCP server information for targeting browser operations
 */
export interface BrowserContext {
  windowId?: number
  activeTab?: Tab
  selectedTabs?: Tab[]
  tabs?: Tab[]
  enabledMcpServers?: string[]
}

// ============================================================================
// Agent SDK Types
// ============================================================================

/**
 * Configuration options for creating an Agent instance.
 * @internal Used by runtime - not needed in generated code
 */
export interface AgentOptions {
  /** Browser context for targeting specific windows/tabs and MCP servers */
  browserContext?: BrowserContext
  signal?: AbortSignal
  /**
   * Enable stateful mode where conversation history persists across act() calls.
   * When true, the agent "remembers" previous interactions.
   * @default true
   */
  stateful?: boolean
}

/**
 * Options for the `nav()` method.
 */
export interface NavOptions {
  /** Target a specific tab by ID */
  tabId?: number
  /** Target a specific window by ID */
  windowId?: number
}

/**
 * Options for the `act()` method.
 */
export interface ActOptions {
  /** Key-value pairs to interpolate into the instruction using `{{key}}` syntax */
  context?: Record<string, unknown>
  /** Maximum number of steps for multi-step actions (default: 10) */
  maxSteps?: number
  /** Target a specific window by ID */
  windowId?: number
  /**
   * Reset conversation state for this act() call.
   * Starts fresh and continues with the new state for subsequent calls.
   * @default false
   */
  resetState?: boolean
  /**
   * Maximum retry attempts when verification fails.
   * Only used when `verify` is set.
   * @default 1
   */
  maxRetries?: number
}

/**
 * Options for the `extract()` method.
 */
export interface ExtractOptions<T> {
  /** Zod schema defining the expected data structure */
  schema: ZodSchema<T>
  /** Optional key-value pairs for additional context */
  context?: Record<string, unknown>
}

/**
 * Options for the `verify()` method.
 */
export interface VerifyOptions {
  /** Optional key-value pairs for additional context */
  context?: Record<string, unknown>
}

/**
 * Types of progress events emitted by agent methods.
 */
export type ProgressEventType =
  | 'nav'
  | 'act'
  | 'extract'
  | 'verify'
  | 'error'
  | 'done'

/**
 * Progress event emitted during agent operations.
 */
export interface ProgressEvent {
  /** The type of operation */
  type: ProgressEventType
  /** Human-readable description of the current operation */
  message: string
  /** Additional metadata about the operation */
  metadata?: Record<string, unknown>
}

/**
 * Result returned by `nav()`.
 */
export interface NavResult {
  /** Whether navigation succeeded */
  success: boolean
}

/**
 * Result returned by `act()`.
 */
export interface ActResult {
  /** Whether the action succeeded */
  success: boolean
  /** The steps executed to complete the action */
  steps: ActStep[]
}

/**
 * A single step executed during an `act()` call.
 */
export interface ActStep {
  /** The agent's reasoning for this step */
  thought?: string
  /** Tool calls made during this step */
  toolCalls?: ToolCall[]
}

/**
 * A tool call made during action execution.
 */
export interface ToolCall {
  /** Name of the tool that was called */
  name: string
  /** Arguments passed to the tool */
  args: Record<string, unknown>
  /** Result returned by the tool */
  result?: unknown
  /** Error message if the tool call failed */
  error?: string
}

/**
 * Result returned by `extract()`.
 */
export interface ExtractResult<T> {
  /** The extracted data matching the provided schema */
  data: T
}

/**
 * Result returned by `verify()`.
 */
export interface VerifyResult {
  /** Whether the verification passed */
  success: boolean
  /** Explanation of why verification passed or failed */
  reason: string
}

/**
 * Options for the `complete()` method.
 */
export interface CompleteOptions {
  /** System prompt to guide the model's behavior */
  system?: string
  /** Optional key-value pairs for additional context */
  context?: Record<string, unknown>
}

/**
 * Result returned by `complete()`.
 */
export interface CompleteResult {
  /** The generated text response */
  text: string
}

/**
 * Options for the `call()` method.
 */
export interface CallOptions {
  /** HTTP method (default: 'GET') */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** Request headers */
  headers?: Record<string, string>
  /** Request body (for POST/PUT/PATCH) */
  body?: unknown
  /** Query parameters */
  query?: Record<string, string | number | boolean>
}

/**
 * Result returned by `call()`.
 */
export interface CallResult<T = unknown> {
  /** Response data */
  data: T
  /** HTTP status code */
  status: number
}

/**
 * Result returned by `sendText()`.
 */
export interface SendTextResult {
  /** Whether the message was sent successfully */
  success: boolean
}

/**
 * Result returned by `sendImage()`.
 */
export interface SendImageResult {
  /** Whether the image was sent successfully */
  success: boolean
}

// ============================================================================
// Workflow Context Types
// ============================================================================

/**
 * Workflow execution context passed to workflow execute function.
 */
export interface WorkflowContext {
  /** Agent options for creating the agent instance */
  agentOptions?: AgentOptions
  /** Task description for the workflow to accomplish */
  task: string
  /** Chat ID for the current conversation */
  chatId?: string
}