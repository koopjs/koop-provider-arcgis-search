const CUSTOM_ERROR_NAME = 'ArcgisSearchProviderError';

module.exports = class ArcgisSearchProviderError extends Error {
    constructor(message, statusCode, customStack = undefined) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = CUSTOM_ERROR_NAME;
        this.statusCode = statusCode;
        if(customStack) {
            this.stack = customStack;
        }
    }
};