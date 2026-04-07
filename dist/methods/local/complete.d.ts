import type { AgentContext } from '../../context';
import type { CompleteOptions, CompleteResult } from '../../types';
/**
 * Generate a text completion using Vercel AI SDK.
 *
 * Environment variables:
 * - OPENAI_API_KEY: Required for OpenAI provider
 * - OPENAI_BASE_URL: Optional, for custom API endpoint (e.g., Ollama, vLLM)
 * - LOCAL_MODEL: Optional, defaults to 'gpt-4o-mini'
 */
export declare function complete(ctx: AgentContext, prompt: string, options?: CompleteOptions): Promise<CompleteResult>;
//# sourceMappingURL=complete.d.ts.map