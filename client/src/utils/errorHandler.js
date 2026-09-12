/**
 * Production-Level Error Handler
 * Converts backend errors to user-friendly messages
 * Logs technical details for debugging
 */

/**
 * Get user-friendly error message from API error
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Please check your internet connection.';
    }
    return 'Unable to connect to server. Please try again.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // 400 - Bad Request
  if (status === 400) {
    if (data?.message) {
      return data.message;
    }
    return 'Invalid input. Please check your data and try again.';
  }

  // 401 - Unauthorized
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  // 403 - Forbidden
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  // 404 - Not Found
  if (status === 404) {
    return 'The item you are looking for was not found.';
  }

  // 409 - Conflict
  if (status === 409) {
    if (data?.message) {
      return data.message;
    }
    return 'This action conflicts with existing data. Please refresh and try again.';
  }

  // 422 - Unprocessable Entity (Validation)
  if (status === 422) {
    if (data?.errors) {
      const errorMessages = Object.values(data.errors)
        .flat()
        .join(', ');
      return `Validation error: ${errorMessages}`;
    }
    return 'Please check your input and try again.';
  }

  // 429 - Too Many Requests
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // 500 - Internal Server Error
  if (status === 500) {
    return 'Server error. Our team has been notified. Please try again later.';
  }

  // 502 - Bad Gateway
  if (status === 502) {
    return 'Server is temporarily unavailable. Please try again later.';
  }

  // 503 - Service Unavailable
  if (status === 503) {
    return 'Service is temporarily unavailable. Please try again later.';
  }

  // Default
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Log error for debugging (technical details)
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 */
export const logError = (context, error) => {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    message: error?.message,
    status: error?.response?.status,
    data: error?.response?.data,
    stack: error?.stack
  };

  console.error(`[${context}]`, errorInfo);

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { tags: { context } });
  }
};

/**
 * Handle API error with logging and user message
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error, context = 'API Call') => {
  const userMessage = getErrorMessage(error);
  logError(context, error);
  return userMessage;
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation errors
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.requiredMessage || `${field} is required`;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return;
    }

    // Min length validation
    if (rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = rule.minLengthMessage || 
        `${field} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = rule.maxLengthMessage || 
        `${field} must be at most ${rule.maxLength} characters`;
    }

    // Min value validation
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors[field] = rule.minMessage || 
        `${field} must be at least ${rule.min}`;
    }

    // Max value validation
    if (rule.max !== undefined && Number(value) > rule.max) {
      errors[field] = rule.maxMessage || 
        `${field} must be at most ${rule.max}`;
    }

    // Pattern validation (regex)
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      errors[field] = rule.patternMessage || `${field} format is invalid`;
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors[field] = rule.customMessage || `${field} is invalid`;
    }
  });

  return errors;
};

/**
 * Check if there are any validation errors
 * @param {Object} errors - Validation errors object
 * @returns {boolean} - True if there are errors
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error);
};

/**
 * Get first error message
 * @param {Object} errors - Validation errors object
 * @returns {string} - First error message or empty string
 */
export const getFirstError = (errors) => {
  const firstError = Object.values(errors).find(error => error);
  return firstError || '';
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (fn, delay = 300) => {
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export default {
  getErrorMessage,
  logError,
  handleApiError,
  validateForm,
  hasErrors,
  getFirstError,
  retryWithBackoff,
  debounce,
  throttle
};
