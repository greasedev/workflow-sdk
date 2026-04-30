import { ConnectionError } from '../errors';
/**
 * Error for scheduler operations
 */
export class SchedulerError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'SchedulerError';
    }
}
/**
 * Scheduler API for managing scheduled tasks.
 * Access via `agent.scheduler` property.
 */
export class Scheduler {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
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
    async status() {
        return this.request({ action: 'status' });
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
    async list(includeDisabled) {
        return this.request({ action: 'list', includeDisabled });
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
    async add(job) {
        return this.request({ action: 'add', job });
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
    async update(taskId, patch) {
        return this.request({ action: 'update', taskId, patch });
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
    async remove(taskId) {
        return this.request({ action: 'remove', taskId });
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
    async run(taskId) {
        return this.request({ action: 'run', taskId });
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
    async runs(taskId) {
        return this.request({ action: 'runs', taskId });
    }
    async request(args) {
        this.ctx.throwIfAborted();
        const response = await chrome.runtime.sendMessage({
            type: 'WORKFLOW_REQUEST',
            endpoint: '/sdk/scheduler',
            body: { ...args, agentId: this.ctx.agentId },
        });
        if (!response || typeof response !== 'object') {
            throw new ConnectionError(`Invalid response from background`, '/sdk/scheduler');
        }
        const result = response;
        if (!result.ok) {
            throw new SchedulerError(result.error?.message ?? `Scheduler request failed with status ${result.status}`, result.status);
        }
        return result.data;
    }
}
