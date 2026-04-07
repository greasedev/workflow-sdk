import { ConnectionError } from '../errors';
/**
 * Error for call operations
 */
export class CallError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'CallError';
    }
}
export async function call(ctx, endpoint, options) {
    ctx.throwIfAborted();
    const response = await chrome.runtime.sendMessage({
        type: 'WORKFLOW_REQUEST',
        endpoint: '/sdk/call',
        body: {
            targetEndpoint: endpoint,
            method: options?.method ?? 'GET',
            headers: options?.headers,
            body: options?.body,
            query: options?.query,
        },
    });
    if (!response || typeof response !== 'object') {
        throw new ConnectionError(`Invalid response from background`, endpoint);
    }
    const result = response;
    if (!result.ok) {
        throw new CallError(result.error?.message ?? `Request failed with status ${result.status}`, result.status);
    }
    return {
        data: result.data,
        status: result.status,
    };
}
