// Error handling and logging utilities

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class Logger {
  constructor(name = 'App') {
    this.name = name;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.name}]`;

    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }
}

/**
 * Handle API errors
 */
export const handleAPIError = (error) => {
  const logger = new Logger('APIError');

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.statusText;

    logger.error(`HTTP ${status}:`, message);

    switch (status) {
      case 400:
        return 'Invalid request';
      case 401:
        return 'Unauthorized - Please login again';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error - Please try again later';
      default:
        return message || 'An error occurred';
    }
  } else if (error.request) {
    // Request made but no response
    logger.error('No response from server');
    return 'Network error - Please check your connection';
  } else {
    // Error in request setup
    logger.error('Request error:', error.message);
    return error.message || 'An unexpected error occurred';
  }
};

/**
 * Retry failed requests
 */
export const retryRequest = async (
  fn,
  maxRetries = 3,
  delayMs = 1000
) => {
  const logger = new Logger('RetryRequest');

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      logger.warn(
        `Attempt ${i + 1} failed, retrying in ${delayMs}ms...`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export { Logger, LOG_LEVELS };
export default { handleAPIError, retryRequest, Logger, LOG_LEVELS };
