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
// Global in-memory task storage (shared across all Scheduler instances)
const taskStore = new Map();
/**
 * Scheduler API for managing scheduled tasks (LOCAL mode with in-memory storage).
 * Only `run()` and `runs()` are mocked - other operations have real implementations.
 */
export class Scheduler {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
     * Get scheduler status.
     */
    async status() {
        this.ctx.throwIfAborted();
        const tasks = Array.from(taskStore.values()).filter(t => t.agentId === this.ctx.agentId);
        const nextWakeAtMs = tasks.reduce((min, t) => t.nextRunAtMs && (min === null || t.nextRunAtMs < min) ? t.nextRunAtMs : min, null);
        return {
            running: true,
            tasks: tasks.length,
            nextWakeAtMs,
        };
    }
    /**
     * List scheduled tasks for this agent.
     */
    async list(includeDisabled) {
        this.ctx.throwIfAborted();
        let tasks = Array.from(taskStore.values()).filter(t => t.agentId === this.ctx.agentId);
        if (!includeDisabled) {
            tasks = tasks.filter(t => t.enabled);
        }
        return {
            count: tasks.length,
            tasks: tasks.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                enabled: t.enabled,
                agentId: t.agentId,
                schedule: t.schedule,
                payload: t.payload,
                delivery: t.delivery,
                nextRunAtMs: t.nextRunAtMs,
                lastStatus: t.lastStatus,
                lastRunAtMs: t.lastRunAtMs,
                lastError: t.lastError,
            })),
        };
    }
    /**
     * Add a new scheduled task.
     */
    async add(job) {
        this.ctx.throwIfAborted();
        this.validateJob(job);
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        const nextRunAtMs = this.calculateNextRunAtMs(job.schedule, now);
        const task = {
            id,
            name: job.name,
            description: job.description,
            enabled: job.enabled ?? true,
            agentId: this.ctx.agentId,
            schedule: { kind: job.schedule.kind },
            payload: this.extractPayloadInfo(job.payload),
            delivery: job.delivery,
            nextRunAtMs,
            lastStatus: undefined,
            lastRunAtMs: undefined,
            lastError: undefined,
            job,
        };
        taskStore.set(id, task);
        console.log(`[LOCAL] scheduler.add: agentId="${this.ctx.agentId}", taskId="${id}", name="${job.name}"`);
        return {
            id,
            name: job.name,
            enabled: job.enabled ?? true,
            agentId: this.ctx.agentId,
            nextRunAtMs,
        };
    }
    /**
     * Update an existing scheduled task.
     */
    async update(taskId, patch) {
        this.ctx.throwIfAborted();
        if (!taskId) {
            throw new SchedulerError('taskId is required');
        }
        const task = taskStore.get(taskId);
        if (!task || task.agentId !== this.ctx.agentId) {
            throw new SchedulerError('Task not found or does not belong to this agent');
        }
        // Apply patch
        if (patch.name !== undefined)
            task.name = patch.name;
        if (patch.description !== undefined)
            task.description = patch.description;
        if (patch.enabled !== undefined)
            task.enabled = patch.enabled;
        if (patch.deleteAfterRun !== undefined)
            task.job.deleteAfterRun = patch.deleteAfterRun;
        if (patch.timeoutMs !== undefined)
            task.job.timeoutMs = patch.timeoutMs;
        if (patch.schedule !== undefined) {
            task.job.schedule = patch.schedule;
            task.schedule = { kind: patch.schedule.kind };
            task.nextRunAtMs = this.calculateNextRunAtMs(patch.schedule, Date.now());
        }
        if (patch.payload !== undefined) {
            // Update payload based on kind - need to handle payload change
            const patchPayload = patch.payload;
            const currentPayload = task.job.payload;
            // If kind changed, create new payload; otherwise patch existing
            if (patchPayload.kind !== currentPayload.kind) {
                // Kind changed - need to create new payload with defaults from patch
                if (patchPayload.kind === 'agentTurn') {
                    task.job.payload = {
                        kind: 'agentTurn',
                        message: patchPayload.message ?? '',
                        model: patchPayload.model,
                        timeoutMs: patchPayload.timeoutMs,
                    };
                }
                else if (patchPayload.kind === 'chatInject') {
                    task.job.payload = {
                        kind: 'chatInject',
                        chatId: patchPayload.chatId ?? '',
                        message: patchPayload.message ?? '',
                    };
                }
                else if (patchPayload.kind === 'invokeWorkflow') {
                    task.job.payload = {
                        kind: 'invokeWorkflow',
                        workflowName: patchPayload.workflowName ?? '',
                        workflowParams: patchPayload.workflowParams,
                    };
                }
            }
            else {
                // Same kind - patch existing fields
                if (patchPayload.kind === 'agentTurn' && currentPayload.kind === 'agentTurn') {
                    if (patchPayload.message !== undefined)
                        currentPayload.message = patchPayload.message;
                    if (patchPayload.model !== undefined)
                        currentPayload.model = patchPayload.model;
                    if (patchPayload.timeoutMs !== undefined)
                        currentPayload.timeoutMs = patchPayload.timeoutMs;
                }
                else if (patchPayload.kind === 'chatInject' && currentPayload.kind === 'chatInject') {
                    if (patchPayload.chatId !== undefined)
                        currentPayload.chatId = patchPayload.chatId;
                    if (patchPayload.message !== undefined)
                        currentPayload.message = patchPayload.message;
                }
                else if (patchPayload.kind === 'invokeWorkflow' && currentPayload.kind === 'invokeWorkflow') {
                    if (patchPayload.workflowName !== undefined)
                        currentPayload.workflowName = patchPayload.workflowName;
                    if (patchPayload.workflowParams !== undefined)
                        currentPayload.workflowParams = patchPayload.workflowParams;
                }
            }
            task.payload = this.extractPayloadInfo(task.job.payload);
        }
        if (patch.delivery !== undefined) {
            if (patch.delivery === null) {
                task.delivery = undefined;
                task.job.delivery = undefined;
            }
            else {
                task.delivery = patch.delivery;
                task.job.delivery = patch.delivery;
            }
        }
        taskStore.set(taskId, task);
        console.log(`[LOCAL] scheduler.update: agentId="${this.ctx.agentId}", taskId="${taskId}"`);
        return {
            id: taskId,
            name: task.name,
            enabled: task.enabled,
            nextRunAtMs: task.nextRunAtMs,
        };
    }
    /**
     * Remove a scheduled task.
     */
    async remove(taskId) {
        this.ctx.throwIfAborted();
        if (!taskId) {
            throw new SchedulerError('taskId is required');
        }
        const task = taskStore.get(taskId);
        if (!task || task.agentId !== this.ctx.agentId) {
            throw new SchedulerError('Task not found or does not belong to this agent');
        }
        taskStore.delete(taskId);
        console.log(`[LOCAL] scheduler.remove: agentId="${this.ctx.agentId}", taskId="${taskId}"`);
        return { ok: true, removed: true };
    }
    /**
     * Run a task immediately (mock - logs only).
     */
    async run(taskId) {
        this.ctx.throwIfAborted();
        if (!taskId) {
            throw new SchedulerError('taskId is required');
        }
        const task = taskStore.get(taskId);
        if (!task || task.agentId !== this.ctx.agentId) {
            throw new SchedulerError('Task not found or does not belong to this agent');
        }
        console.log(`[MOCK] scheduler.run: agentId="${this.ctx.agentId}", taskId="${taskId}", name="${task.name}"`);
        return { ok: true, ran: true };
    }
    /**
     * Get run logs for a task (mock - returns empty array).
     */
    async runs(taskId) {
        this.ctx.throwIfAborted();
        if (!taskId) {
            throw new SchedulerError('taskId is required');
        }
        const task = taskStore.get(taskId);
        if (!task || task.agentId !== this.ctx.agentId) {
            throw new SchedulerError('Task not found or does not belong to this agent');
        }
        console.log(`[MOCK] scheduler.runs: agentId="${this.ctx.agentId}", taskId="${taskId}"`);
        return { taskId, runs: [] };
    }
    validateJob(job) {
        if (!job.name) {
            throw new SchedulerError('job.name is required');
        }
        if (!job.schedule) {
            throw new SchedulerError('job.schedule is required');
        }
        if (!job.payload) {
            throw new SchedulerError('job.payload is required');
        }
        if (!job.schedule.kind) {
            throw new SchedulerError('job.schedule.kind is required');
        }
        const validScheduleKinds = ['at', 'every', 'cron'];
        if (!validScheduleKinds.includes(job.schedule.kind)) {
            throw new SchedulerError(`Invalid schedule.kind: ${job.schedule.kind}. Must be one of: ${validScheduleKinds.join(', ')}`);
        }
        // Validate payload based on kind
        const validPayloadKinds = ['agentTurn', 'chatInject', 'invokeWorkflow'];
        if (!validPayloadKinds.includes(job.payload.kind)) {
            throw new SchedulerError(`Invalid payload.kind: ${job.payload.kind}. Must be one of: ${validPayloadKinds.join(', ')}`);
        }
        if (job.payload.kind === 'agentTurn' && !job.payload.message) {
            throw new SchedulerError('payload.message is required for agentTurn');
        }
        if (job.payload.kind === 'chatInject') {
            if (!job.payload.chatId) {
                throw new SchedulerError('payload.chatId is required for chatInject');
            }
            if (!job.payload.message) {
                throw new SchedulerError('payload.message is required for chatInject');
            }
        }
        if (job.payload.kind === 'invokeWorkflow' && !job.payload.workflowName) {
            throw new SchedulerError('payload.workflowName is required for invokeWorkflow');
        }
    }
    extractPayloadInfo(payload) {
        if (payload.kind === 'agentTurn') {
            return { kind: 'agentTurn', message: payload.message };
        }
        else if (payload.kind === 'chatInject') {
            return { kind: 'chatInject', message: payload.message };
        }
        else {
            return { kind: 'invokeWorkflow' };
        }
    }
    calculateNextRunAtMs(schedule, now) {
        switch (schedule.kind) {
            case 'at':
                if (schedule.atMs)
                    return schedule.atMs;
                if (schedule.at)
                    return new Date(schedule.at).getTime();
                return now + 60000; // default 1 minute
            case 'every':
                return now + (schedule.everyMs ?? 60000);
            case 'cron':
                return now + 60000; // cron requires actual cron parser, mock to 1 minute
            default:
                return now + 60000;
        }
    }
}
