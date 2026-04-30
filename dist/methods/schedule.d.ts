import type { AgentContext } from '../context';
import type { SchedulerJob, SchedulerPatch, SchedulerStatusResult, SchedulerListResult, SchedulerAddResult, SchedulerUpdateResult, SchedulerRemoveResult, SchedulerRunResult, SchedulerRunsResult } from '../types';
/**
 * Error for scheduler operations
 */
export declare class SchedulerError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
/**
 * Scheduler API for managing scheduled tasks.
 * Access via `agent.scheduler` property.
 */
export declare class Scheduler {
    private readonly ctx;
    constructor(ctx: AgentContext);
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
    status(): Promise<SchedulerStatusResult>;
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
    list(includeDisabled?: boolean): Promise<SchedulerListResult>;
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
    add(job: SchedulerJob): Promise<SchedulerAddResult>;
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
    update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult>;
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
    remove(taskId: string): Promise<SchedulerRemoveResult>;
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
    run(taskId: string): Promise<SchedulerRunResult>;
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
    runs(taskId: string): Promise<SchedulerRunsResult>;
    private request;
}
//# sourceMappingURL=schedule.d.ts.map