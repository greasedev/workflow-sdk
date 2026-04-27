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
    // Mock implementation - returns success
    console.log(`[MOCK] sendText: agentId="${ctx.agentId}", chatId="${chatId}", title="${title}", content="${content}", visibility="${visibility}"`);
    return { success: true };
}
