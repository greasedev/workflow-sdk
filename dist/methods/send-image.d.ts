import type { AgentContext } from '../context';
import type { SendImageResult, Visibility } from '../types';
/**
 * Error for sendImage operations
 */
export declare class SendImageError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare function sendImage(ctx: AgentContext, chatId: string, base64Image: string, visibility?: Visibility): Promise<SendImageResult>;
//# sourceMappingURL=send-image.d.ts.map