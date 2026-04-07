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
    // Mock implementation - returns success
    console.log(`[MOCK] sendImage: chatId="${chatId}", imageLength=${base64Image.length}, visibility="${visibility}"`);
    return { success: true };
}
