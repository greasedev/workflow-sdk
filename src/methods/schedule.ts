import type { AgentContext } from '../context'
import { ConnectionError } from '../errors'
import type {
  SchedulerJob,
  SchedulerPatch,
  SchedulerStatusResult,
  SchedulerListResult,
  SchedulerAddResult,
  SchedulerUpdateResult,
  SchedulerRemoveResult,
  SchedulerRunResult,
  SchedulerRunsResult,
} from '../types'

/**
 * Error for scheduler operations
 */
export class SchedulerError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'SchedulerError'
  }
}

/**
 * Scheduler API for managing scheduled tasks.
 * Access via `agent.scheduler` property.
 */
export class Scheduler {
  constructor(private readonly ctx: AgentContext) {}

  /**
   * Get scheduler status.
   *
   * @returns Promise resolving to scheduler status
   *
   * @example
   * ```typescript
   * const status = await agent.scheduler.status()
   * // { running: true, tasks: 5, nextWakeAtMs: 1234567890 }
   * ```
   */
  async status(): Promise<SchedulerStatusResult> {
    return this.request<SchedulerStatusResult>({ action: 'status' })
  }

  /**
   * List scheduled tasks for this agent.
   *
   * @param includeDisabled - Include disabled tasks (default: false)
   * @returns Promise resolving to list of tasks
   *
   * @example
   * ```typescript
   * const { count, tasks } = await agent.scheduler.list()
   * const allTasks = await agent.scheduler.list(true)
   * ```
   */
  async list(includeDisabled?: boolean): Promise<SchedulerListResult> {
    return this.request<SchedulerListResult>({ action: 'list', includeDisabled })
  }

  /**
   * Add a new scheduled task.
   *
   * @param job - Task definition
   * @returns Promise resolving to created task info
   *
   * @example
   * ```typescript
   * // One-shot task at specific time
   * const task = await agent.scheduler.add({
   *   name: 'Reminder',
   *   schedule: { kind: 'at', at: '2026-05-01T09:00:00Z' },
   *   payload: { kind: 'agentTurn', message: 'Send reminder' }
   * })
   *
   * // Recurring task with interval
   * const task = await agent.scheduler.add({
   *   name: 'Hourly check',
   *   schedule: { kind: 'every', everyMs: 3600000 },
   *   payload: { kind: 'agentTurn', message: 'Check status' }
   * })
   *
   * // Cron expression (weekdays at 9am)
   * const task = await agent.scheduler.add({
   *   name: 'Daily report',
   *   schedule: { kind: 'cron', expr: '0 9 * * 1-5', tz: 'America/New_York' },
   *   payload: { kind: 'agentTurn', message: 'Generate report' }
   * })
   * ```
   */
  async add(job: SchedulerJob): Promise<SchedulerAddResult> {
    return this.request<SchedulerAddResult>({ action: 'add', job })
  }

  /**
   * Update an existing scheduled task.
   *
   * @param taskId - Task ID to update
   * @param patch - Fields to update
   * @returns Promise resolving to updated task info
   *
   * @example
   * ```typescript
   * await agent.scheduler.update('task-123', { enabled: false })
   * await agent.scheduler.update('task-123', {
   *   schedule: { kind: 'cron', expr: '0 10 * * 1-5' }
   * })
   * ```
   */
  async update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult> {
    return this.request<SchedulerUpdateResult>({ action: 'update', taskId, patch })
  }

  /**
   * Remove a scheduled task.
   *
   * @param taskId - Task ID to remove
   * @returns Promise resolving to removal result
   *
   * @example
   * ```typescript
   * const { ok, removed } = await agent.scheduler.remove('task-123')
   * ```
   */
  async remove(taskId: string): Promise<SchedulerRemoveResult> {
    return this.request<SchedulerRemoveResult>({ action: 'remove', taskId })
  }

  /**
   * Run a task immediately (force run).
   *
   * @param taskId - Task ID to run
   * @returns Promise resolving to run result
   *
   * @example
   * ```typescript
   * const { ok, ran } = await agent.scheduler.run('task-123')
   * ```
   */
  async run(taskId: string): Promise<SchedulerRunResult> {
    return this.request<SchedulerRunResult>({ action: 'run', taskId })
  }

  /**
   * Get run logs for a task.
   *
   * @param taskId - Task ID to get logs for
   * @returns Promise resolving to run logs
   *
   * @example
   * ```typescript
   * const { taskId, runs } = await agent.scheduler.runs('task-123')
   * ```
   */
  async runs(taskId: string): Promise<SchedulerRunsResult> {
    return this.request<SchedulerRunsResult>({ action: 'runs', taskId })
  }

  private async request<T>(args: Record<string, unknown>): Promise<T> {
    this.ctx.throwIfAborted()

    const response = await chrome.runtime.sendMessage({
      type: 'WORKFLOW_REQUEST',
      endpoint: '/sdk/scheduler',
      body: { ...args, agentId: this.ctx.agentId },
    })

    if (!response || typeof response !== 'object') {
      throw new ConnectionError(
        `Invalid response from background`,
        '/sdk/scheduler',
      )
    }

    const result = response as { ok: boolean; status: number; data?: unknown; error?: { message: string } }

    if (!result.ok) {
      throw new SchedulerError(
        result.error?.message ?? `Scheduler request failed with status ${result.status}`,
        result.status,
      )
    }

    return result.data as T
  }
}