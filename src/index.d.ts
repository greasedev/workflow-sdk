/**
 * @greaseclaw/workflow-sdk Type Definitions
 */

// ============================================================================
// LLM Configuration Types
// ============================================================================

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

export interface LLMConfig {
  provider: LLMProvider
  model?: string
  apiKey?: string
  baseUrl?: string
  resourceName?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
}

// ============================================================================
// Browser Context Types
// ============================================================================

export interface Tab {
  id: number
  url?: string
  title?: string
  pageId?: number
}

export interface BrowserContext {
  windowId?: number
  activeTab?: Tab
  selectedTabs?: Tab[]
  tabs?: Tab[]
  enabledMcpServers?: string[]
}

// ============================================================================
// UI Message Stream Types
// ============================================================================

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
// Agent Options Types
// ============================================================================

export interface AgentOptions {
  llm?: LLMConfig
  browserContext?: BrowserContext
  signal?: AbortSignal
  stateful?: boolean
}

export interface NavOptions {
  tabId?: number
  windowId?: number
}

export interface ActOptions {
  context?: Record<string, unknown>
  maxSteps?: number
  windowId?: number
  resetState?: boolean
  maxRetries?: number
}

export interface ExtractOptions<T> {
  schema: unknown
  context?: Record<string, unknown>
}

export interface VerifyOptions {
  context?: Record<string, unknown>
}

export interface CompleteOptions {
  system?: string
  context?: Record<string, unknown>
}

export interface CallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, string | number | boolean>
}

// ============================================================================
// Result Types
// ============================================================================

export interface NavResult {
  success: boolean
}

export interface ActResult {
  success: boolean
  steps: ActStep[]
}

export interface ActStep {
  thought?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface ExtractResult<T> {
  data: T
}

export interface VerifyResult {
  success: boolean
  reason: string
}

export interface CompleteResult {
  text: string
}

export interface CallResult<T = unknown> {
  data: T
  status: number
}

// ============================================================================
// Progress Event Types
// ============================================================================

export type ProgressEventType =
  | 'nav'
  | 'act'
  | 'extract'
  | 'verify'
  | 'error'
  | 'done'

export interface ProgressEvent {
  type: ProgressEventType
  message: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Workflow Context Types
// ============================================================================

export interface WorkflowContext<TApis = Record<string, unknown>> {
  agent: Agent
  apis: TApis
}

// ============================================================================
// Request/Response Types
// ============================================================================

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

// ============================================================================
// Error Classes
// ============================================================================

export class WorkflowSDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  )
}

export class ConnectionError extends WorkflowSDKError {
  constructor(message: string, public readonly url: string)
}

export class ActionError extends WorkflowSDKError {
  constructor(message: string, statusCode?: number)
}

export class CompletionError extends WorkflowSDKError {
  constructor(message: string, statusCode?: number)
}

export class CallError extends Error {
  constructor(message: string, public readonly statusCode?: number)
}

// ============================================================================
// Agent Class
// ============================================================================

export class Agent implements AsyncDisposable {
  readonly signal?: AbortSignal
  readonly browserContext?: BrowserContext
  readonly stateful: boolean

  constructor(options: AgentOptions)

  get sessionId(): string | null
  set sessionId(value: string | null)

  act(instruction: string, options?: ActOptions): Promise<ActResult>
  complete(prompt: string, options?: CompleteOptions): Promise<CompleteResult>
  call<T = unknown>(endpoint: string, options?: CallOptions): Promise<CallResult<T>>
  dispose(): Promise<void>
  [Symbol.asyncDispose](): Promise<void>
  throwIfAborted(): void
}