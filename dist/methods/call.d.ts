import type { AgentContext } from '../context';
import type { CallOptions, CallResult } from '../types';
/**
 * Error for call operations
 */
export declare class CallError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare function call<T>(ctx: AgentContext, endpoint: string, options?: CallOptions): Promise<CallResult<T>>;
//# sourceMappingURL=call.d.ts.map