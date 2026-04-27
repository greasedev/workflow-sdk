import { ConnectionError } from '../errors';
/**
 * Error for sendText operations
 */
export class SendTextError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'SendTextError';
    }
}
export async function sendText(ctx, chatId, title, content, visibility = 'user') {
    ctx.throwIfAborted();
    const response = await chrome.runtime.sendMessage({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/send_text',
        body: { agentId: ctx.agentId, chatId, title, content, visibility },
    });
    if (!response || typeof response !== 'object') {
        throw new ConnectionError(`Invalid response from background`, '/sdk/send_text');
    }
    const result = response;
    if (!result.ok) {
        throw new SendTextError(result.error?.message ?? `Send text failed with status ${result.status}`, result.status);
    }
    return { success: true };
}
