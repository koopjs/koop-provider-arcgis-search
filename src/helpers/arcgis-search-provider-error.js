const CUSTOM_ERROR_NAME = 'ArcgisSearchProviderError';

module.exports = class ArcgisSearchProviderError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = CUSTOM_ERROR_NAME;
        this.statusCode = statusCode;
    }
};