import { WorkflowSDKError } from './errors';
import { call } from './methods/local/call';
import { complete } from './methods/local/complete';
import { sendImage } from './methods/local/send-image';
import { sendText } from './methods/local/send-text';
import { request } from './utils/request.local';
/**
 * Internal error class for dispose operations
 */
class DisposeError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'DISPOSE_ERROR', statusCode);
        this.name = 'DisposeError';
    }
}
/**
 * Browser automation agent for GreaseClaw workflows (LOCAL mode).
 * Uses mock implementations for local development/testing.
 *
 * @remarks
 * The Agent instance is injected by the runtime - never instantiate it directly.
 * Export a `run` function that receives the agent as a parameter.
 *
 * @example
 * ```typescript
 * import type { Agent } from '@greaseclaw/workflow-sdk/local'
 *
 * export async function run(agent: Agent) {
 *   const { text } = await agent.complete('Summarize the page')
 *   const { data } = await agent.call('/api/users')
 *   return { message: 'Done', text, data }
 * }
 * ```
 */
export class Agent {
    signal;
    browserContext;
    stateful;
    _sessionId = null;
    _disposed = false;
    constructor(options) {
        this.signal = options.signal;
        this.browserContext = options.browserContext;
        this.stateful = options.stateful ?? true;
        if (this.stateful) {
            this._sessionId = crypto.randomUUID();
        }
    }
    get sessionId() {
        return this._sessionId;
    }
    set sessionId(value) {
        this._sessionId = value;
    }
    async dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        if (this._sessionId) {
            try {
                await request(this, '/session/dispose', { sessionId: this._sessionId }, DisposeError);
            }
            catch {
                // Ignore dispose errors
            }
        }
    }
    async [Symbol.asyncDispose]() {
        await this.dispose();
    }
    throwIfAborted() {
        if (this.signal?.aborted) {
            throw new Error('Operation aborted');
        }
    }
    /**
     * Generate a text completion using the LLM (mocked in LOCAL mode).
     *
     * @param prompt - The prompt to send to the LLM
     * @param options - Optional completion settings
     * @returns Promise resolving to `{ text: string }`
     *
     * @example
     * ```typescript
     * const { text } = await agent.complete('Summarize the current page')
     * ```
     */
    complete(prompt, options) {
        return complete(this, prompt, options);
    }
    /**
     * Call an API endpoint (mocked in LOCAL mode).
     *
     * @param endpoint - The API endpoint path (e.g., '/api/users')
     * @param options - Optional request settings
     * @returns Promise resolving to `{ data: T, status: number }`
     *
     * @example
     * ```typescript
     * const { data } = await agent.call('/api/users')
     * ```
     */
    call(endpoint, options) {
        return call(this, endpoint, options);
    }
    /**
     * Send a text message (mocked in LOCAL mode).
     *
     * @param chatId - The chat ID to send the message to
     * @param title - The title of the message
     * @param content - The content of the message
     * @param visibility - Who can see the message: 'user' (default), 'agent', or 'all'
     * @returns Promise resolving to `{ success: boolean }`
     *
     * @example
     * ```typescript
     * await agent.sendText('chat-123', 'Title', 'Hello, how can I help you?')
     * ```
     */
    sendText(chatId, title, content, visibility) {
        return sendText(this, chatId, title, content, visibility);
    }
    /**
     * Send an image (mocked in LOCAL mode).
     *
     * @param chatId - The chat ID to send the image to
     * @param base64Image - Base64 encoded image string
     * @param visibility - Who can see the image: 'user' (default), 'agent', or 'all'
     * @returns Promise resolving to `{ success: boolean }`
     *
     * @example
     * ```typescript
     * await agent.sendImage('chat-123', 'data:image/png;base64,iVBORw0KGgo...')
     * ```
     */
    sendImage(chatId, base64Image, visibility) {
        return sendImage(this, chatId, base64Image, visibility);
    }
}
