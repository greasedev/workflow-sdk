import type { AgentContext } from './context';
import { Scheduler } from './methods/schedule';
import Dexie from 'dexie';
import type { AgentOptions, BrowserContext, CallOptions, CallResult, CompleteOptions, CompleteResult, SendImageResult, SendTextResult, Visibility } from './types';
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
export declare class Agent implements AsyncDisposable, AgentContext {
    readonly agentId: string;
    readonly signal?: AbortSignal;
    readonly browserContext?: BrowserContext;
    readonly stateful: boolean;
    readonly scheduler: Scheduler;
    private _sessionId;
    private _disposed;
    private _db;
    constructor(options: AgentOptions);
    get sessionId(): string | null;
    set sessionId(value: string | null);
    dispose(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    throwIfAborted(): void;
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
    getDb(): Dexie;
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
    getPageLink(pageId: string, params?: Record<string, string | number | boolean>): string;
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
    complete(prompt: string, options?: CompleteOptions): Promise<CompleteResult>;
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
    call<T = unknown>(endpoint: string, options?: CallOptions): Promise<CallResult<T>>;
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
    sendText(chatId: string, title: string, content: string, visibility?: Visibility): Promise<SendTextResult>;
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
    sendImage(chatId: string, base64Image: string, visibility?: Visibility): Promise<SendImageResult>;
}
//# sourceMappingURL=agent.d.ts.map