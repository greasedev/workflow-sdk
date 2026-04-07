/**
 * Base error class for all Agent SDK errors.
 * All SDK errors extend this class.
 */
export declare class WorkflowSDKError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined);
}
/**
 * Thrown when the agent cannot connect to the runtime.
 */
export declare class ConnectionError extends WorkflowSDKError {
    readonly url: string;
    constructor(message: string, url: string);
}
/**
 * Thrown when `nav()` fails to navigate to the target URL.
 */
export declare class NavigationError extends WorkflowSDKError {
    constructor(message: string, statusCode?: number);
}
/**
 * Thrown when `act()` fails to perform the requested action.
 */
export declare class ActionError extends WorkflowSDKError {
    constructor(message: string, statusCode?: number);
}
/**
 * Thrown when `extract()` fails to extract data or data doesn't match schema.
 */
export declare class ExtractionError extends WorkflowSDKError {
    constructor(message: string, statusCode?: number);
}
/**
 * Thrown when `verify()` encounters an error during verification.
 */
export declare class VerificationError extends WorkflowSDKError {
    constructor(message: string, statusCode?: number);
}
/**
 * Thrown when `complete()` fails to generate a response.
 */
export declare class CompletionError extends WorkflowSDKError {
    constructor(message: string, statusCode?: number);
}
//# sourceMappingURL=errors.d.ts.map