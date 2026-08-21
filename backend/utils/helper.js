/**
 * Utility functions for formatting API responses uniformly
 */

const formatResponse = (data, message = 'Success') => {
    return {
        status: 'success',
        message,
        data
    };
};

const formatError = (message = 'Server Error') => {
    return {
        status: 'error',
        message
    };
};

module.exports = {
    formatResponse,
    formatError
};
