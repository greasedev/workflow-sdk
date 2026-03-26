import type { ZodSchema } from 'zod'

// ============================================================================
// LLM Configuration Types (embedded from shared)
// ============================================================================

/**
 * Supported LLM providers
 */
export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'openrouter'
  | 'azure'
  | 'ollama'
  | 'lmstudio'
  | 'bedrock'
  | 'browseros'
  | 'openai-compatible'
  | 'moonshot'

/**
 * LLM configuration schema
 * Used by SDK endpoints and agent configuration
 */
export interface LLMConfig {
  provider: LLMProvider
  model?: string
  apiKey?: string
  baseUrl?: string
  // Azure-specific
  resourceName?: string
  // AWS Bedrock-specific
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
}

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
// UI Message Stream Types (embedded from shared)
// ============================================================================

/**
 * UI Message Stream events (Vercel AI SDK format).
 */
export type UIMessageStreamEvent =
  | { type: 'start'; messageId?: string }
  | { type: 'start-step' }
  | { type: 'finish-step' }
  | { type: 'finish'; finishReason: string; messageMetadata?: unknown }
  | { type: 'abort' }
  | { type: 'error'; errorText: string }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'text-end'; id: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-input-delta'; toolCallId: string; inputTextDelta: string }
  | { type: 'tool-input-available'; toolCallId: string; toolName: string; input: unknown }
  | { type: 'tool-input-error'; toolCallId: string; errorText: string }
  | { type: 'tool-output-available'; toolCallId: string; output: unknown }
  | { type: 'tool-output-error'; toolCallId: string; errorText: string }
  | { type: 'source-url'; sourceId: string; url: string; title?: string }
  | { type: 'file'; url: string; mediaType: string }

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

// ============================================================================
// Workflow Context Types
// ============================================================================

import type { Agent } from './agent'

/**
 * Workflow execution context passed to workflow execute function.
 */
export interface WorkflowContext {
  /** Agent instance for browser automation */
  agent: Agent
  /** Task description for the workflow to accomplish */
  task: string
}