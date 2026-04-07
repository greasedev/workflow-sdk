import { ConnectionError } from '../errors';
export async function request(ctx, endpoint, body, ErrorClass) {
    ctx.throwIfAborted();
    let response;
    try {
        const result = await chrome.runtime.sendMessage({
            type: 'WORKFLOW_REQUEST',
            endpoint,
            body,
        });
        response = result;
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Operation aborted');
        }
        throw new ConnectionError(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`, endpoint);
    }
    if (!response.ok) {
        const errorMessage = response.error?.message ?? `Request failed with status ${response.status}`;
        throw new ErrorClass(errorMessage, response.status);
    }
    return response.data;
}
