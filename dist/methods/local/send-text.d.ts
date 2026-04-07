import type { AgentContext } from '../../context';
import type { SendTextResult, Visibility } from '../../types';
/**
 * Error for sendText operations
 */
export declare class SendTextError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare function sendText(ctx: AgentContext, chatId: string, title: string, content: string, visibility?: Visibility): Promise<SendTextResult>;
//# sourceMappingURL=send-text.d.ts.map