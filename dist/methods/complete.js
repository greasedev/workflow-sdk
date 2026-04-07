import { CompletionError } from '../errors';
import { request } from '../utils/request';
export async function complete(ctx, prompt, options) {
    const result = await request(ctx, '/sdk/complete', {
        prompt,
        system: options?.system,
        context: options?.context,
    }, CompletionError);
    return result;
}
