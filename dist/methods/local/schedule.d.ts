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
 * Scheduler API for managing scheduled tasks (mock implementation for LOCAL mode).
 * Validates parameters and logs requests.
 */
export declare class Scheduler {
    private readonly ctx;
    constructor(ctx: AgentContext);
    /**
     * Get scheduler status (mock).
     */
    status(): Promise<SchedulerStatusResult>;
    /**
     * List scheduled tasks (mock).
     */
    list(includeDisabled?: boolean): Promise<SchedulerListResult>;
    /**
     * Add a new scheduled task (mock).
     */
    add(job: SchedulerJob): Promise<SchedulerAddResult>;
    /**
     * Update a scheduled task (mock).
     */
    update(taskId: string, patch: SchedulerPatch): Promise<SchedulerUpdateResult>;
    /**
     * Remove a scheduled task (mock).
     */
    remove(taskId: string): Promise<SchedulerRemoveResult>;
    /**
     * Run a task immediately (mock).
     */
    run(taskId: string): Promise<SchedulerRunResult>;
    /**
     * Get run logs for a task (mock).
     */
    runs(taskId: string): Promise<SchedulerRunsResult>;
    private validateJob;
}
//# sourceMappingURL=schedule.d.ts.map