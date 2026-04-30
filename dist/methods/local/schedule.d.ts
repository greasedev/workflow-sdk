import type { AgentContext } from '../../context';
import type { SchedulerJob, SchedulerPatch, SchedulerStatusResult, SchedulerListResult, SchedulerAddResult, SchedulerUpdateResult, SchedulerRemoveResult, SchedulerRunResult, SchedulerRunsResult } from '../../types';
/**
 * Error for scheduler operations
 */
export declare class SchedulerError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
/**
 * Scheduler API for managing scheduled tasks (LOCAL mode with in-memory storage).
 * Only `run()` and `runs()` are mocked - other operations have real implementations.
 */
export declare class Scheduler {
    private readonly ctx;
    constructor(ctx: AgentContext);
    /**
     * Get scheduler status.
     */
    status(): Promise<SchedulerStatusResult>;
    /**
     * List scheduled tasks for this agent.
     */
    list(includeDisabled?: boolean): Promise<SchedulerListResult>;
    /**
     * Add a new scheduled task.
     */
    add(job: SchedulerJob): Promise<SchedulerAddResult>;
    /**
     * Update an existing scheduled task.
     */
    update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult>;
    /**
     * Remove a scheduled task.
     */
    remove(taskId: string): Promise<SchedulerRemoveResult>;
    /**
     * Run a task immediately (mock - logs only).
     */
    run(taskId: string): Promise<SchedulerRunResult>;
    /**
     * Get run logs for a task (mock - returns empty array).
     */
    runs(taskId: string): Promise<SchedulerRunsResult>;
    private validateJob;
    private extractPayloadInfo;
    private calculateNextRunAtMs;
}
//# sourceMappingURL=schedule.d.ts.map