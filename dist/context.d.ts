import type { BrowserContext } from './types';
/**
 * Context interface that method modules use to access agent state and utilities.
 * The Agent class implements this interface.
 */
export interface AgentContext {
    readonly browserContext?: BrowserContext;
    readonly signal?: AbortSignal;
    readonly stateful: boolean;
    sessionId: string | null;
    throwIfAborted(): void;
}
//# sourceMappingURL=context.d.ts.map