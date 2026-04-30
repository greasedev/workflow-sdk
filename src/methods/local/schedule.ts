import type { AgentContext } from '../../context'
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
} from '../../types'

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
 * Scheduler API for managing scheduled tasks (mock implementation for LOCAL mode).
 * Validates parameters and logs requests.
 */
export class Scheduler {
  constructor(private readonly ctx: AgentContext) {}

  /**
   * Get scheduler status (mock).
   */
  async status(): Promise<SchedulerStatusResult> {
    this.ctx.throwIfAborted()
    console.log(`[MOCK] scheduler.status: agentId="${this.ctx.agentId}"`)
    return { running: true, tasks: 0, nextWakeAtMs: null }
  }

  /**
   * List scheduled tasks (mock).
   */
  async list(includeDisabled?: boolean): Promise<SchedulerListResult> {
    this.ctx.throwIfAborted()
    console.log(`[MOCK] scheduler.list: agentId="${this.ctx.agentId}", includeDisabled=${includeDisabled ?? false}`)
    return { count: 0, tasks: [] }
  }

  /**
   * Add a new scheduled task (mock).
   */
  async add(job: SchedulerJob): Promise<SchedulerAddResult> {
    this.ctx.throwIfAborted()
    this.validateJob(job)
    console.log(`[MOCK] scheduler.add: agentId="${this.ctx.agentId}"`, JSON.stringify(job, null, 2))
    return {
      id: `mock-task-${Date.now()}`,
      name: job.name,
      enabled: job.enabled ?? true,
      agentId: this.ctx.agentId,
      nextRunAtMs: Date.now() + 60000,
    }
  }

  /**
   * Update a scheduled task (mock).
   */
  async update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult> {
    this.ctx.throwIfAborted()
    if (!taskId) {
      throw new SchedulerError('taskId is required')
    }
    console.log(`[MOCK] scheduler.update: agentId="${this.ctx.agentId}", taskId="${taskId}"`, JSON.stringify(patch, null, 2))
    return {
      id: taskId,
      name: patch.name ?? 'updated-task',
      enabled: patch.enabled ?? true,
      nextRunAtMs: Date.now() + 60000,
    }
  }

  /**
   * Remove a scheduled task (mock).
   */
  async remove(taskId: string): Promise<SchedulerRemoveResult> {
    this.ctx.throwIfAborted()
    if (!taskId) {
      throw new SchedulerError('taskId is required')
    }
    console.log(`[MOCK] scheduler.remove: agentId="${this.ctx.agentId}", taskId="${taskId}"`)
    return { ok: true, removed: true }
  }

  /**
   * Run a task immediately (mock).
   */
  async run(taskId: string): Promise<SchedulerRunResult> {
    this.ctx.throwIfAborted()
    if (!taskId) {
      throw new SchedulerError('taskId is required')
    }
    console.log(`[MOCK] scheduler.run: agentId="${this.ctx.agentId}", taskId="${taskId}"`)
    return { ok: true, ran: true }
  }

  /**
   * Get run logs for a task (mock).
   */
  async runs(taskId: string): Promise<SchedulerRunsResult> {
    this.ctx.throwIfAborted()
    if (!taskId) {
      throw new SchedulerError('taskId is required')
    }
    console.log(`[MOCK] scheduler.runs: agentId="${this.ctx.agentId}", taskId="${taskId}"`)
    return { taskId, runs: [] }
  }

  private validateJob(job: SchedulerJob): void {
    if (!job.name) {
      throw new SchedulerError('job.name is required')
    }
    if (!job.schedule) {
      throw new SchedulerError('job.schedule is required')
    }
    if (!job.payload) {
      throw new SchedulerError('job.payload is required')
    }
    if (!job.schedule.kind) {
      throw new SchedulerError('job.schedule.kind is required')
    }
    const validScheduleKinds = ['at', 'every', 'cron']
    if (!validScheduleKinds.includes(job.schedule.kind)) {
      throw new SchedulerError(`Invalid schedule.kind: ${job.schedule.kind}. Must be one of: ${validScheduleKinds.join(', ')}`)
    }
    if (!job.payload.kind) {
      throw new SchedulerError('job.payload.kind is required')
    }
    if (!job.payload.message) {
      throw new SchedulerError('job.payload.message is required')
    }
    const validPayloadKinds = ['agentTurn', 'chatInject']
    if (!validPayloadKinds.includes(job.payload.kind)) {
      throw new SchedulerError(`Invalid payload.kind: ${job.payload.kind}. Must be one of: ${validPayloadKinds.join(', ')}`)
    }
  }
}