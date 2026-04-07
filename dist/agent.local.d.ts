import type { AgentContext } from './context';
import type { AgentOptions, BrowserContext, CallOptions, CallResult, CompleteOptions, CompleteResult, SendImageResult, SendTextResult, Visibility } from './types';
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
export declare class Agent implements AsyncDisposable, AgentContext {
    readonly signal?: AbortSignal;
    readonly browserContext?: BrowserContext;
    readonly stateful: boolean;
    private _sessionId;
    private _disposed;
    constructor(options: AgentOptions);
    get sessionId(): string | null;
    set sessionId(value: string | null);
    dispose(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    throwIfAborted(): void;
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
    complete(prompt: string, options?: CompleteOptions): Promise<CompleteResult>;
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
    call<T = unknown>(endpoint: string, options?: CallOptions): Promise<CallResult<T>>;
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
    sendText(chatId: string, title: string, content: string, visibility?: Visibility): Promise<SendTextResult>;
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
    sendImage(chatId: string, base64Image: string, visibility?: Visibility): Promise<SendImageResult>;
}
//# sourceMappingURL=agent.local.d.ts.map