import { WorkflowSDKError } from './errors';
import { call } from './methods/call';
import { complete } from './methods/complete';
import { Scheduler } from './methods/schedule';
import { sendImage } from './methods/send-image';
import { sendText } from './methods/send-text';
import { request } from './utils/request';
import Dexie from 'dexie';
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
 * Browser automation agent for GreaseClaw workflows.
 * Provides high-level methods to interact with browser and call APIs.
 *
 * @remarks
 * The Agent instance is injected by the runtime - never instantiate it directly.
 * Export a `run` function that receives the agent as a parameter.
 *
 * @example
 * ```typescript
 * import type { Agent } from '@greaseclaw/workflow-sdk'
 *
 * export async function run(agent: Agent) {
 *   const { text } = await agent.complete('Summarize the page')
 *   const { data } = await agent.call('/api/users')
 *   return { message: 'Done', text, data }
 * }
 * ```
 */
export class Agent {
    agentId;
    signal;
    browserContext;
    stateful;
    scheduler;
    _sessionId = null;
    _disposed = false;
    _db = null;
    constructor(options) {
        this.agentId = options.agentId ?? "default-agent-id";
        this.signal = options.signal;
        this.browserContext = options.browserContext;
        this.stateful = options.stateful ?? true;
        this.scheduler = new Scheduler(this);
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
     * Get the Dexie database instance for this agent.
     * The database name is "db-{agentId}" and can be used for persistent storage.
     *
     * @returns Dexie database instance
     *
     * @example
     * ```typescript
     * const db = agent.getDb()
     * // Define schema and use for storage
     * db.version(1).stores({ items: '++id, name' })
     * await db.table('items').add({ name: 'test' })
     * ```
     */
    getDb() {
        if (!this._db) {
            this._db = new Dexie(`db-${this.agentId}`);
        }
        return this._db;
    }
    /**
     * Generate a page link XML tag for the given page ID and parameters.
     *
     * @param pageId - The page identifier (e.g., 'index', 'detail')
     * @param params - Optional query parameters
     * @returns HTML string in XML tag format: `<pageLink>pageId.html?params</pageLink>`
     *
     * @example
     * ```typescript
     * agent.getPageLink('index', { query: 'key' })
     * // Returns: '<pageLink>index.html?query=key</pageLink>'
     *
     * agent.getPageLink('detail')
     * // Returns: '<pageLink>detail.html</pageLink>'
     * ```
     */
    getPageLink(pageId, params) {
        const href = params && Object.keys(params).length > 0
            ? `${pageId}.html?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
            : `${pageId}.html`;
        return `<pageLink>${href}</pageLink>`;
    }
    /**
     * Generate a text completion using the LLM.
     *
     * @param prompt - The prompt to send to the LLM
     * @param options - Optional completion settings
     * @returns Promise resolving to `{ text: string }`
     * @throws {CompletionError} When completion fails
     *
     * @example
     * ```typescript
     * const { text } = await agent.complete('Summarize the current page')
     *
     * const { text } = await agent.complete('Analyze this data', {
     *   system: 'You are a data analyst'
     * })
     * ```
     */
    complete(prompt, options) {
        return complete(this, prompt, options);
    }
    /**
     * Call an API endpoint.
     *
     * @param endpoint - The API endpoint path (e.g., '/api/users')
     * @param options - Optional request settings
     * @returns Promise resolving to `{ data: T, status: number }`
     * @throws {CallError} When the request fails
     *
     * @example
     * ```typescript
     * // GET request
     * const { data } = await agent.call('/api/users')
     *
     * // POST request
     * const { data } = await agent.call('/api/users', {
     *   method: 'POST',
     *   body: { name: 'John' }
     * })
     *
     * // With query parameters
     * const { data } = await agent.call('/api/users', {
     *   query: { page: 1, limit: 10 }
     * })
     * ```
     */
    call(endpoint, options) {
        return call(this, endpoint, options);
    }
    /**
     * Send a text message.
     *
     * @param chatId - The chat ID to send the message to
     * @param title - The title of the message
     * @param content - The content of the message
     * @param visibility - Who can see the message: 'user' (default), 'agent', or 'all'
     * @returns Promise resolving to `{ success: boolean }`
     * @throws {SendTextError} When sending fails
     *
     * @example
     * ```typescript
     * // User-only message (default)
     * await agent.sendText('chat-123', 'Title', 'Hello, how can I help you?')
     *
     * // Agent-only message
     * await agent.sendText('chat-123', 'Debug', 'Internal note', 'agent')
     *
     * // Visible to all
     * await agent.sendText('chat-123', 'Status', 'Processing...', 'all')
     * ```
     */
    sendText(chatId, title, content, visibility) {
        return sendText(this, chatId, title, content, visibility);
    }
    /**
     * Send an image.
     *
     * @param chatId - The chat ID to send the image to
     * @param base64Image - Base64 encoded image string
     * @param visibility - Who can see the image: 'user' (default), 'agent', or 'all'
     * @returns Promise resolving to `{ success: boolean }`
     * @throws {SendImageError} When sending fails
     *
     * @example
     * ```typescript
     * // User-only image (default)
     * await agent.sendImage('chat-123', 'data:image/png;base64,iVBORw0KGgo...')
     *
     * // Agent-only image
     * await agent.sendImage('chat-123', base64Data, 'agent')
     * ```
     */
    sendImage(chatId, base64Image, visibility) {
        return sendImage(this, chatId, base64Image, visibility);
    }
}
