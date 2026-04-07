import { ConnectionError } from '../errors';
/**
 * Error for sendImage operations
 */
export class SendImageError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'SendImageError';
    }
}
export async function sendImage(ctx, chatId, base64Image, visibility = 'user') {
    ctx.throwIfAborted();
    const response = await chrome.runtime.sendMessage({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/send_image',
        body: { chatId, base64Image, visibility },
    });
    if (!response || typeof response !== 'object') {
        throw new ConnectionError(`Invalid response from background`, '/sdk/send_image');
    }
    const result = response;
    if (!result.ok) {
        throw new SendImageError(result.error?.message ?? `Send image failed with status ${result.status}`, result.status);
    }
    return { success: true };
}
