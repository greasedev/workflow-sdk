/**
 * Default API base URL for LOCAL mode
 */
const DEFAULT_API_BASE_URL = 'http://localhost:9222/json/api';
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
    const method = options?.method ?? 'GET';
    const headers = options?.headers;
    const requestBody = options?.body;
    const query = options?.query;
    // Build URL with base URL prefix if not absolute
    let url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? endpoint
        : `${DEFAULT_API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    if (query && Object.keys(query).length > 0) {
        const params = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]));
        url = `${url}?${params.toString()}`;
    }
    const fetchOptions = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (requestBody && method !== 'GET') {
        fetchOptions.body = JSON.stringify(requestBody);
    }
    const response = await fetch(url, fetchOptions);
    const data = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();
    if (!response.ok) {
        throw new CallError(typeof data === 'object' && data && 'message' in data
            ? data.message
            : `Request failed with status ${response.status}`, response.status);
    }
    return {
        data: data,
        status: response.status,
    };
}
