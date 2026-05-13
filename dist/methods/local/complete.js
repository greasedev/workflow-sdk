import { generateText, Output } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { z } from 'zod';
/**
 * Default model for LOCAL mode completions
 */
const DEFAULT_MODEL = 'gpt-4o-mini';
/**
 * Generate a text completion using Vercel AI SDK.
 *
 * Environment variables:
 * - OPENAI_API_KEY: Required for OpenAI provider
 * - OPENAI_BASE_URL: Optional, for custom API endpoint (e.g., Ollama, vLLM, DashScope)
 * - LOCAL_MODEL: Optional, defaults to 'gpt-4o-mini'
 */
export async function complete(ctx, prompt, options) {
    ctx.throwIfAborted();
    const model = process.env.LOCAL_MODEL ?? DEFAULT_MODEL;
    const baseUrl = process.env.OPENAI_BASE_URL;
    // Use chat completions API for better compatibility with OpenAI-compatible endpoints
    // (DashScope, Ollama, vLLM, etc.)
    const client = baseUrl
        ? createOpenAI({ baseURL: baseUrl })
        : openai;
    if (options?.jsonSchema) {
        // Use generateText with Output.object for structured output
        const result = await generateText({
            model: client.chat(model),
            prompt,
            system: options?.system,
            output: Output.object({ schema: jsonSchemaToZod(options.jsonSchema) }),
        });
        return {
            json: result.output,
        };
    }
    const result = await generateText({
        model: client.chat(model),
        prompt,
        system: options?.system,
    });
    return {
        text: result.text,
    };
}
/**
 * Convert JsonSchema to Zod schema.
 */
function jsonSchemaToZod(schema) {
    if (!schema)
        return z.object({});
    switch (schema.type) {
        case 'string':
            if (schema.enum) {
                return z.enum(schema.enum);
            }
            let stringSchema = z.string();
            if (schema.minLength)
                stringSchema = stringSchema.min(schema.minLength);
            if (schema.maxLength)
                stringSchema = stringSchema.max(schema.maxLength);
            if (schema.pattern)
                stringSchema = stringSchema.regex(new RegExp(schema.pattern));
            return stringSchema;
        case 'number':
        case 'integer':
            let numberSchema = schema.type === 'integer' ? z.number().int() : z.number();
            if (schema.minimum)
                numberSchema = numberSchema.min(schema.minimum);
            if (schema.maximum)
                numberSchema = numberSchema.max(schema.maximum);
            return numberSchema;
        case 'boolean':
            return z.boolean();
        case 'array':
            return z.array(jsonSchemaToZod(schema.items));
        case 'object':
            if (!schema.properties)
                return z.object({});
            const properties = {};
            for (const [key, value] of Object.entries(schema.properties)) {
                properties[key] = jsonSchemaToZod(value);
            }
            let objectSchema = z.object(properties);
            // Make non-required properties optional
            if (schema.required) {
                const required = new Set(schema.required);
                for (const key of Object.keys(properties)) {
                    if (!required.has(key)) {
                        properties[key] = properties[key].optional();
                    }
                }
                objectSchema = z.object(properties);
            }
            return objectSchema;
        case 'null':
            return z.null();
        default:
            return z.object({});
    }
}
