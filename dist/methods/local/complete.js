import { generateText } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai';
/**
 * Default model for LOCAL mode completions
 */
const DEFAULT_MODEL = 'gpt-4o-mini';
/**
 * Generate a text completion using Vercel AI SDK.
 *
 * Environment variables:
 * - OPENAI_API_KEY: Required for OpenAI provider
 * - OPENAI_BASE_URL: Optional, for custom API endpoint (e.g., Ollama, vLLM)
 * - LOCAL_MODEL: Optional, defaults to 'gpt-4o-mini'
 */
export async function complete(ctx, prompt, options) {
    ctx.throwIfAborted();
    const model = process.env.LOCAL_MODEL ?? DEFAULT_MODEL;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const client = baseUrl
        ? createOpenAI({ baseURL: baseUrl })
        : openai;
    const result = await generateText({
        model: client(model),
        prompt,
        system: options?.system,
    });
    return {
        text: result.text,
    };
}
