/**
 * Security Utilities - Production-Level Security
 * Input sanitization, XSS prevention, CSRF protection, etc.
 */

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Sanitize user input
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get CSRF token from meta tag
 * @returns {string|null} - CSRF token or null
 */
export const getCsrfToken = () => {
  try {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  } catch (e) {
    console.warn('Error getting CSRF token:', e.message);
    return null;
  }
};

/**
 * Rate limiter - Prevent spam
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if request is allowed
   * @returns {boolean} - True if allowed
   */
  isAllowed() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    this.requests.push(now);
    return true;
  }

  /**
   * Get remaining requests
   * @returns {number} - Remaining requests
   */
  getRemaining() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.requests = this.requests.filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Reset rate limiter
   */
  reset() {
    this.requests = [];
  }
}

/**
 * Create rate limiters for different operations
 */
export const rateLimiters = {
  login: new RateLimiter(5, 60000), // 5 attempts per minute
  register: new RateLimiter(3, 60000), // 3 attempts per minute
  api: new RateLimiter(100, 60000), // 100 requests per minute
  form: new RateLimiter(1, 3000) // 1 submission per 3 seconds
};

/**
 * Debounce function with rate limiting
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {RateLimiter} limiter - Optional rate limiter
 * @returns {Function} - Debounced function
 */
export const debounceWithRateLimit = (fn, delay = 300, limiter = null) => {
  let timeoutId;

  return (...args) => {
    if (limiter && !limiter.isAllowed()) {
      console.warn('Rate limit exceeded');
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function with rate limiting
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @param {RateLimiter} limiter - Optional rate limiter
 * @returns {Function} - Throttled function
 */
export const throttleWithRateLimit = (fn, delay = 300, limiter = null) => {
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();

    if (limiter && !limiter.isAllowed()) {
      console.warn('Rate limit exceeded');
      return;
    }

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

/**
 * Validate form data
 * @param {object} data - Form data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation errors
 */
export const validateFormData = (data, schema) => {
  const errors = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      return;
    }

    if (!value && !rules.required) return;

    // Email validation
    if (rules.email && !isValidEmail(value)) {
      errors[field] = rules.emailMessage || 'Invalid email format';
    }

    // URL validation
    if (rules.url && !isValidUrl(value)) {
      errors[field] = rules.urlMessage || 'Invalid URL format';
    }

    // Min length validation
    if (rules.minLength && value.toString().length < rules.minLength) {
      errors[field] = rules.minLengthMessage || 
        `${field} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.toString().length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || 
        `${field} must be at most ${rules.maxLength} characters`;
    }

    // Min value validation
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors[field] = rules.minMessage || 
        `${field} must be at least ${rules.min}`;
    }

    // Max value validation
    if (rules.max !== undefined && Number(value) > rules.max) {
      errors[field] = rules.maxMessage || 
        `${field} must be at most ${rules.max}`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      errors[field] = rules.customMessage || `${field} is invalid`;
    }
  });

  return errors;
};

/**
 * Check if there are validation errors
 * @param {object} errors - Validation errors
 * @returns {boolean} - True if there are errors
 */
export const hasValidationErrors = (errors) => {
  return Object.values(errors).some(error => error);
};

/**
 * Get first validation error
 * @param {object} errors - Validation errors
 * @returns {string} - First error message or empty string
 */
export const getFirstValidationError = (errors) => {
  const firstError = Object.values(errors).find(error => error);
  return firstError || '';
};

/**
 * Encode URL parameter
 * @param {string} param - Parameter to encode
 * @returns {string} - Encoded parameter
 */
export const encodeUrlParam = (param) => {
  return encodeURIComponent(param);
};

/**
 * Decode URL parameter
 * @param {string} param - Parameter to decode
 * @returns {string} - Decoded parameter
 */
export const decodeUrlParam = (param) => {
  try {
    return decodeURIComponent(param);
  } catch (e) {
    console.warn('Error decoding URL parameter:', e.message);
    return param;
  }
};

/**
 * Generate random string (for nonces, etc.)
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
export const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Hash string (simple, not cryptographic)
 * @param {string} str - String to hash
 * @returns {string} - Hash
 */
export const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

export default {
  sanitizeHtml,
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  getCsrfToken,
  RateLimiter,
  rateLimiters,
  debounceWithRateLimit,
  throttleWithRateLimit,
  validateFormData,
  hasValidationErrors,
  getFirstValidationError,
  encodeUrlParam,
  decodeUrlParam,
  generateRandomString,
  hashString
};
