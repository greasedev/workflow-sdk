/**
 * @greaseclaw/workflow-sdk Type Definitions
 */

import Dexie from 'dexie'

export type { Dexie }

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
// Agent Options Types
// ============================================================================

export interface AgentOptions {
  /** Unique identifier for the agent instance */
  agentId?: string
  browserContext?: BrowserContext
  signal?: AbortSignal
  stateful?: boolean
}

export interface NavOptions {
  tabId?: number
  windowId?: number
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

export interface SendTextResult {
  success: boolean
}

export interface SendImageResult {
  success: boolean
}

// ============================================================================
// Progress Event Types
// ============================================================================

export type ProgressEventType =
  | 'nav'
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

export interface WorkflowContext {
  /** Agent options for creating the agent instance */
  agentOptions?: AgentOptions
  /** Task description for the workflow to accomplish */
  task: string
  /** Chat ID for the current conversation */
  chatId?: string
  /** Key-value pairs for workflow parameters */
  params?: Record<string, unknown>
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  error?: unknown;
}

// ============================================================================
// Scheduler Types
// ============================================================================

export type SchedulerAction = 'status' | 'list' | 'add' | 'update' | 'remove' | 'run' | 'runs'

export type ScheduleKind = 'at' | 'every' | 'cron'

export type PayloadKind = 'agentTurn' | 'chatInject'

export interface ScheduleDelivery {
  channel: string
  to: string
  bestEffort?: boolean
}

export interface ScheduleDefinition {
  kind: ScheduleKind
  at?: string
  atMs?: number
  everyMs?: number
  anchor?: string
  anchorMs?: number
  expr?: string
  tz?: string
}

export interface SchedulePayload {
  kind: PayloadKind
  message: string
  model?: string
  chatId?: string
  timeoutMs?: number
}

export interface SchedulerJob {
  name: string
  description?: string
  enabled?: boolean
  deleteAfterRun?: boolean
  timeoutMs?: number
  agentId?: string
  schedule: ScheduleDefinition
  payload: SchedulePayload
  delivery?: ScheduleDelivery
}

export interface SchedulerPatch {
  name?: string
  description?: string
  enabled?: boolean
  deleteAfterRun?: boolean
  timeoutMs?: number
  schedule?: ScheduleDefinition
  payload?: Partial<SchedulePayload>
  delivery?: ScheduleDelivery | null
}

export interface SchedulerArgs {
  action: SchedulerAction
  includeDisabled?: boolean
  agentId?: string
  job?: SchedulerJob
  taskId?: string
  patch?: SchedulerPatch
}

export interface SchedulerTaskInfo {
  id: string
  name: string
  description?: string
  enabled: boolean
  agentId?: string
  schedule: { kind: string }
  payload: { kind: string; message: string }
  delivery?: ScheduleDelivery
  nextRunAtMs?: number
  lastStatus?: string
  lastRunAtMs?: number
  lastError?: string
}

export interface SchedulerStatusResult {
  running: boolean
  tasks: number
  nextWakeAtMs: number | null
}

export interface SchedulerListResult {
  count: number
  tasks: SchedulerTaskInfo[]
}

export interface SchedulerAddResult {
  id: string
  name: string
  enabled: boolean
  agentId?: string
  nextRunAtMs?: number
}

export interface SchedulerUpdateResult {
  id: string
  name: string
  enabled: boolean
  nextRunAtMs?: number
}

export interface SchedulerRemoveResult {
  ok: boolean
  removed: boolean
}

export interface SchedulerRunResult {
  ok: boolean
  ran: boolean
  reason?: string
}

export interface SchedulerRunLog {
  id: string
  taskId: string
  timestamp: number
  status: 'ok' | 'error' | 'skipped'
  error?: string
  durationMs?: number
  chatId?: string
}

export interface SchedulerRunsResult {
  taskId: string
  runs: SchedulerRunLog[]
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
  code: string
  statusCode?: number
  constructor(message: string, code: string, statusCode?: number)
}

export class ConnectionError extends WorkflowSDKError {
  url: string
  constructor(message: string, url: string)
}

export class ActionError extends WorkflowSDKError {
  constructor(message: string, statusCode?: number)
}

export class CompletionError extends WorkflowSDKError {
  constructor(message: string, statusCode?: number)
}

export class CallError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number)
}

export class SendTextError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number)
}

export class SendImageError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number)
}

export class SchedulerError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number)
}

// ============================================================================
// Scheduler Class
// ============================================================================

export class Scheduler {
  status(): Promise<SchedulerStatusResult>
  list(includeDisabled?: boolean): Promise<SchedulerListResult>
  add(job: SchedulerJob): Promise<SchedulerAddResult>
  update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult>
  remove(taskId: string): Promise<SchedulerRemoveResult>
  run(taskId: string): Promise<SchedulerRunResult>
  runs(taskId: string): Promise<SchedulerRunsResult>
}

// ============================================================================
// Agent Class
// ============================================================================

export class Agent implements AsyncDisposable {
  readonly agentId: string
  readonly signal?: AbortSignal
  readonly browserContext?: BrowserContext
  readonly stateful: boolean
  readonly scheduler: Scheduler

  constructor(options: AgentOptions)

  get sessionId(): string | null
  set sessionId(value: string | null)

  /**
   * Get the Dexie database instance for this agent.
   * The database name is "db-{agentId}" and can be used for persistent storage.
   */
  getDb(): Dexie

  /**
   * Generate a page link XML tag for the given page ID and parameters.
   * @param pageId - The page identifier (e.g., 'index', 'detail')
   * @param params - Optional query parameters
   * @returns HTML string in XML tag format: `<pageLink>pageId.html?params</pageLink>`
   */
  getPageLink(pageId: string, params?: Record<string, string | number | boolean>): string

  complete(prompt: string, options?: CompleteOptions): Promise<CompleteResult>
  call<T = unknown>(endpoint: string, options?: CallOptions): Promise<CallResult<T>>
  sendText(chatId: string, title: string, content: string): Promise<SendTextResult>
  sendImage(chatId: string, base64Image: string): Promise<SendImageResult>
  dispose(): Promise<void>
  [Symbol.asyncDispose](): Promise<void>
  throwIfAborted(): void
}