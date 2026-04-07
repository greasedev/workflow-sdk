export async function request(ctx, endpoint, body, ErrorClass) {
    ctx.throwIfAborted();
    // Mock implementation - returns simulated response
    console.log(`[MOCK] request: endpoint="${endpoint}", body=${JSON.stringify(body)}`);
    return { mocked: true, endpoint };
}
