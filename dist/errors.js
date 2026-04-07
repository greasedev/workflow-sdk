/**
 * Base error class for all Agent SDK errors.
 * All SDK errors extend this class.
 */
export class WorkflowSDKError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'WorkflowSDKError';
    }
}
/**
 * Thrown when the agent cannot connect to the runtime.
 */
export class ConnectionError extends WorkflowSDKError {
    url;
    constructor(message, url) {
        super(message, 'CONNECTION_ERROR');
        this.url = url;
        this.name = 'ConnectionError';
    }
}
/**
 * Thrown when `nav()` fails to navigate to the target URL.
 */
export class NavigationError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'NAVIGATION_ERROR', statusCode);
        this.name = 'NavigationError';
    }
}
/**
 * Thrown when `act()` fails to perform the requested action.
 */
export class ActionError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'ACTION_ERROR', statusCode);
        this.name = 'ActionError';
    }
}
/**
 * Thrown when `extract()` fails to extract data or data doesn't match schema.
 */
export class ExtractionError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'EXTRACTION_ERROR', statusCode);
        this.name = 'ExtractionError';
    }
}
/**
 * Thrown when `verify()` encounters an error during verification.
 */
export class VerificationError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'VERIFICATION_ERROR', statusCode);
        this.name = 'VerificationError';
    }
}
/**
 * Thrown when `complete()` fails to generate a response.
 */
export class CompletionError extends WorkflowSDKError {
    constructor(message, statusCode) {
        super(message, 'COMPLETION_ERROR', statusCode);
        this.name = 'CompletionError';
    }
}
