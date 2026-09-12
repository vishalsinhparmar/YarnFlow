import { useState, useCallback, useRef, useEffect } from 'react';
import { getErrorMessage, logError } from '../utils/errorHandler';

/**
 * Custom hook for API calls with error handling, loading states, and retry logic
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - API state and methods
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    autoFetch = false,
    retryCount = 3,
    retryDelay = 1000,
    context = 'API Call'
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);

  /**
   * Execute the API call with retry logic
   */
  const execute = useCallback(
    async (...args) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      retryCountRef.current = 0;

      const attemptCall = async () => {
        try {
          const result = await apiFunction(...args, {
            signal: abortControllerRef.current.signal
          });

          setData(result);
          setError(null);
          retryCountRef.current = 0;

          if (onSuccess) {
            onSuccess(result);
          }

          return result;
        } catch (err) {
          // Don't handle aborted requests
          if (err.name === 'AbortError') {
            return;
          }

          // Don't retry on client errors (4xx)
          if (err.response?.status >= 400 && err.response?.status < 500) {
            const userMessage = getErrorMessage(err);
            setError(userMessage);
            logError(context, err);

            if (onError) {
              onError(userMessage);
            }

            throw err;
          }

          // Retry on server errors (5xx) or network errors
          if (retryCountRef.current < retryCount) {
            retryCountRef.current += 1;
            setRetrying(true);

            const delay = retryDelay * Math.pow(2, retryCountRef.current - 1);
            await new Promise(resolve => setTimeout(resolve, delay));

            setRetrying(false);
            return attemptCall();
          }

          // All retries exhausted
          const userMessage = getErrorMessage(err);
          setError(userMessage);
          logError(context, err);

          if (onError) {
            onError(userMessage);
          }

          throw err;
        }
      };

      try {
        return await attemptCall();
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, retryCount, retryDelay, context]
  );

  /**
   * Refetch the data
   */
  const refetch = useCallback(
    async (...args) => {
      return execute(...args);
    },
    [execute]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setRetrying(false);
    retryCountRef.current = 0;
  }, []);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, execute]);

  return {
    data,
    loading,
    error,
    retrying,
    execute,
    refetch,
    clearError,
    reset,
    isLoading: loading || retrying
  };
};

/**
 * Custom hook for paginated API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - Paginated API state and methods
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const {
    pageSize = 20,
    onSuccess,
    onError,
    context = 'Paginated API Call'
  } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetch a page of data
   */
  const fetchPage = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction({
          page: pageNum,
          limit: pageSize
        });

        const newItems = result.data || [];
        const newTotal = result.total || 0;

        setItems(append ? [...items, ...newItems] : newItems);
        setPage(pageNum);
        setTotal(newTotal);
        setHasMore(newItems.length === pageSize);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const userMessage = getErrorMessage(err);
        setError(userMessage);
        logError(context, err);

        if (onError) {
          onError(userMessage);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, pageSize, items, onSuccess, onError, context]
  );

  /**
   * Load next page
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(page + 1, true);
    }
  }, [loading, hasMore, page, fetchPage]);

  /**
   * Refetch current page
   */
  const refetch = useCallback(() => {
    fetchPage(page, false);
  }, [page, fetchPage]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    setError(null);
    setHasMore(true);
  }, []);

  return {
    items,
    page,
    total,
    loading,
    error,
    hasMore,
    fetchPage,
    loadMore,
    refetch,
    reset
  };
};

export default useApi;
