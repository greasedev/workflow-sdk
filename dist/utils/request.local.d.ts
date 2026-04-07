import type { AgentContext } from '../context';
import type { WorkflowSDKError } from '../errors';
type ErrorConstructor = new (message: string, statusCode?: number) => WorkflowSDKError;
export interface WorkflowRequestMessage {
    type: 'WORKFLOW_REQUEST';
    endpoint: string;
    body: Record<string, unknown>;
}
export interface WorkflowResponse<T = unknown> {
    ok: boolean;
    status: number;
    data?: T;
    error?: {
        message: string;
    };
}
export declare function request<T>(ctx: AgentContext, endpoint: string, body: Record<string, unknown>, ErrorClass: ErrorConstructor): Promise<T>;
export {};
//# sourceMappingURL=request.local.d.ts.map