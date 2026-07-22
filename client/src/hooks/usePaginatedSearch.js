import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_LIMIT = 50;

/**
 * Reusable paginated search hook for dropdowns with infinite scroll.
 *
 * @param {Function} fetchFn - async (params) => response where response contains
 *                             data[], pagination object (current/pages/total), and optionally total
 * @param {Object} options - { limit, extraParams, initialLoad, enabled }
 * @returns {Object}
 */
export const usePaginatedSearch = (fetchFn, options = {}) => {
  const { limit = DEFAULT_LIMIT, extraParams = {}, initialLoad = true, enabled = true } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Use refs for everything that changes but shouldn't recreate fetchItems
  const fetchFnRef = useRef(fetchFn);
  const extraParamsRef = useRef(extraParams);
  const limitRef = useRef(limit);
  const enabledRef = useRef(enabled);
  const searchRef = useRef(search);
  const pageRef = useRef(page);
  const loadingRef = useRef(false);

  // Keep refs in sync with latest values every render
  fetchFnRef.current = fetchFn;
  extraParamsRef.current = extraParams;
  limitRef.current = limit;
  enabledRef.current = enabled;
  searchRef.current = search;
  pageRef.current = page;
  loadingRef.current = loading || loadingMore;

  // fetchItems is stable — never recreated, always reads latest values via refs
  const fetchItems = useCallback(async (newSearch = '', newPage = 1, append = false) => {
    if (!enabledRef.current || !fetchFnRef.current) return;

    const isLoadMore = append && newPage > 1;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        limit: limitRef.current,
        page: newPage,
        ...(newSearch ? { search: newSearch } : {}),
        ...extraParamsRef.current
      };

      const response = await fetchFnRef.current(params);
      const data = response?.data || [];
      const pagination = response?.pagination || {};
      // Support both shapes: {current,pages,total} and {currentPage,totalPages,totalCount}
      const totalCount = pagination.total ?? pagination.totalCount ?? response?.total ?? null;
      const currentPage = pagination.current ?? pagination.currentPage ?? newPage;
      const totalPages = pagination.pages ?? pagination.totalPages ?? 1;

      setTotal(totalCount);
      setHasMore(currentPage < totalPages);

      if (append) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item._id || item.value || item.id));
          const newItems = data.filter(item => {
            const id = item._id || item.value || item.id;
            return !existingIds.has(id);
          });
          return [...prev, ...newItems];
        });
      } else {
        setItems(data);
      }

      return response;
    } catch (error) {
      console.error('Error fetching paginated items:', error);
      if (!append) setItems([]);
      setHasMore(false);
      return null;
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — reads everything via refs for stability

  // Initial auto-load when enabled becomes true
  useEffect(() => {
    if (initialLoad && enabled) {
      fetchItems('', 1, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Debounced search: reset to page 1 when search term changes.
  // Short delay for empty (clear) so rapid backspace doesn't fire on every keystroke.
  const searchTimerRef = useRef(null);
  const handleSearch = useCallback((newSearch) => {
    setSearch(newSearch);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const delay = newSearch === '' ? 120 : 300;
    searchTimerRef.current = setTimeout(() => {
      fetchItems(newSearch, 1, false);
    }, delay);
  }, [fetchItems]);

  // Load more: fetch next page and append
  const handleLoadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setPage(nextPage);
    fetchItems(searchRef.current, nextPage, true);
  }, [fetchItems, hasMore]);

  const refresh = useCallback(() => {
    setSearch('');
    setPage(1);
    fetchItems('', 1, false);
  }, [fetchItems]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    hasMore,
    total,
    page,
    search,
    handleSearch,
    handleLoadMore,
    refresh,
    fetchItems
  };
};

export default usePaginatedSearch;
