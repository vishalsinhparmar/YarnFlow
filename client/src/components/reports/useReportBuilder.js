import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import reportsAPI from '../../services/reportsAPI';

const initialFilters = { condition: 'and', groups: [{ condition: 'and', filters: [] }] };

const getDefaultDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Format as YYYY-MM-DD using local date (not UTC)
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return {
    startDate: dateStr,
    endDate: dateStr
  };
};

export function useReportBuilder() {
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  const [selectedReportKey, setSelectedReportKey] = useState('');
  const [definition, setDefinition] = useState(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const [preview, setPreview] = useState({ data: [], total: 0, page: 1, limit: 50, loading: false, error: '' });
  const [exporting, setExporting] = useState(false);

  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [currentSavedReportId, setCurrentSavedReportId] = useState(null);
  const pendingSavedConfig = useRef(null);

    const loadSavedReports = useCallback(async () => {
    setSavedReportsLoading(true);
    try {
      const res = await reportsAPI.getSavedReports();
      setSavedReports(res.data || []);
    } catch {
      setSavedReports([]);
    } finally {
      setSavedReportsLoading(false);
    }
  }, []);
  // Load reports list on mount
  useEffect(() => {
    let mounted = true;
    reportsAPI.getReports()
      .then(res => { if (mounted) setReports(res.data || []); })
      .catch(err => { if (mounted) setReportsError(err.message); })
      .finally(() => { if (mounted) setReportsLoading(false); });
    loadSavedReports();
    return () => { mounted = false; };
  }, [loadSavedReports]);

  // Load definition when report changes
  useEffect(() => {
    if (!selectedReportKey) {
      setDefinition(null);
      return;
    }
    let mounted = true;
    setDefinitionLoading(true);
    reportsAPI.getDefinition(selectedReportKey)
      .then(res => {
        if (!mounted) return;
        setDefinition(res.data);
        // Apply pending saved config if available
        if (pendingSavedConfig.current) {
          const config = pendingSavedConfig.current;
          const validFieldKeys = new Set(res.data.fields.map(f => f.key));
          
          // Filter selected fields to only include valid ones
          const validFields = (config.selectedFields || []).filter(key => validFieldKeys.has(key));
          
          // Filter sort fields to only include valid ones
          const validSort = (config.sort || []).filter(s => validFieldKeys.has(s.fieldKey));
          
          // Filter filter fields to only include valid ones
          const validFilters = filterValidFields(config.filters || initialFilters, validFieldKeys);
          
          setSelectedFields(validFields);
          setFilters(validFilters);
          setSort(validSort);
          if (config.dateRange) {
            setDateRange(config.dateRange);
          }
          pendingSavedConfig.current = null;
        }
      })
      .catch(err => { if (mounted) setReportsError(err.message); })
      .finally(() => { if (mounted) setDefinitionLoading(false); });

    return () => { mounted = false; };
  }, [selectedReportKey]);

  // Helper function to filter out invalid fields from filters
  const filterValidFields = (filters, validFieldKeys) => {
    if (!filters || !filters.groups) return initialFilters;
    return {
      condition: filters.condition || 'and',
      groups: filters.groups.map(group => ({
        condition: group.condition || 'and',
        filters: (group.filters || []).filter(f => validFieldKeys.has(f.field))
      })).filter(g => g.filters.length > 0)
    };
  };

  const fieldMap = useMemo(() => {
    if (!definition) return new Map();
    return new Map(definition.fields.map(f => [f.key, f]));
  }, [definition]);

  const selectedFieldDefs = useMemo(() => {
    return selectedFields.map(key => fieldMap.get(key)).filter(Boolean);
  }, [selectedFields, fieldMap]);

  const toggleField = useCallback((key) => {
    setSelectedFields(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      return [...prev, key];
    });
  }, []);

  const moveField = useCallback((fromIndex, toIndex) => {
    setSelectedFields(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const addFilter = useCallback((groupIndex = 0) => {
    setFilters(prev => {
      const next = { ...prev, groups: prev.groups.map((g) => ({ ...g, filters: [...g.filters] })) };
      const fieldKey = definition?.fields.find(f => f.filterable)?.key || '';
      const field = fieldMap.get(fieldKey);
      next.groups[groupIndex].filters.push({
        field: fieldKey,
        operator: field?.operators?.[0] || 'eq',
        value: '',
        valueTo: ''
      });
      return next;
    });
  }, [definition, fieldMap]);

  const updateFilter = useCallback((groupIndex, filterIndex, patch) => {
    setFilters(prev => {
      const next = { ...prev, groups: prev.groups.map((g) => ({ ...g, filters: [...g.filters] })) };
      const current = next.groups[groupIndex].filters[filterIndex];
      const merged = { ...current, ...patch };
      // Reset value/operator when field changes
      if (patch.field && patch.field !== current.field) {
        const field = fieldMap.get(patch.field);
        merged.operator = field?.operators?.[0] || 'eq';
        merged.value = '';
        merged.valueTo = '';
      }
      next.groups[groupIndex].filters[filterIndex] = merged;
      return next;
    });
  }, [fieldMap]);

  const removeFilter = useCallback((groupIndex, filterIndex) => {
    setFilters(prev => {
      const next = { ...prev, groups: prev.groups.map((g) => ({ ...g, filters: [...g.filters] })) };
      next.groups[groupIndex].filters.splice(filterIndex, 1);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const addSort = useCallback(() => {
    setSort(prev => {
      const field = definition?.fields.find(f => f.sortable);
      return [...prev, { field: field?.key || '', direction: 'asc' }];
    });
  }, [definition]);

  const updateSort = useCallback((index, patch) => {
    setSort(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const removeSort = useCallback((index) => {
    setSort(prev => prev.filter((_, i) => i !== index));
  }, []);

  const buildPayload = useCallback(() => {
    // Filter out any invalid fields from the payload
    const validFieldKeys = definition ? new Set(definition.fields.map(f => f.key)) : new Set();
    
    const validSelectedFields = selectedFields.filter(key => validFieldKeys.has(key));
    const validSort = sort.filter(s => validFieldKeys.has(s.fieldKey));
    const validFilters = {
      condition: filters.condition || 'and',
      groups: (filters.groups || []).map(group => ({
        condition: group.condition || 'and',
        filters: (group.filters || []).filter(f => validFieldKeys.has(f.field))
      })).filter(g => g.filters.length > 0)
    };
    
    return {
      selectedFields: validSelectedFields,
      filters: validFilters,
      sort: validSort,
      dateRange
    };
  }, [selectedFields, filters, sort, dateRange, definition]);

  const runPreview = useCallback(async (page = 1) => {
    if (!selectedReportKey || selectedFields.length === 0) return;
    setPreview(p => ({ ...p, loading: true, error: '' }));
    try {
      const res = await reportsAPI.preview(selectedReportKey, buildPayload(), { page, limit: preview.limit });
      setPreview({
        data: res.data.data || [],
        total: res.data.total || 0,
        page: res.data.page || page,
        limit: res.data.limit || preview.limit,
        loading: false,
        error: ''
      });
    } catch (err) {
      setPreview(p => ({ ...p, loading: false, error: err.message }));
    }
  }, [selectedReportKey, selectedFields, buildPayload, preview.limit]);

  const runExport = useCallback(async () => {
    if (!selectedReportKey || selectedFields.length === 0) return;
    setExporting(true);
    try {
      const filename = `${selectedReportKey}_Report_${Date.now()}.xlsx`;
      await reportsAPI.export(selectedReportKey, buildPayload(), filename);
    } finally {
      setExporting(false);
    }
  }, [selectedReportKey, selectedFields, buildPayload]);

  const saveReport = useCallback(async (name, isShared = false) => {
    if (!selectedReportKey || !name.trim()) return;
    
    // If editing an existing report, update it instead of creating new
    if (currentSavedReportId) {
      const res = await reportsAPI.updateSavedReport(currentSavedReportId, {
        name: name.trim(),
        config: buildPayload(),
        isShared
      });
      await loadSavedReports();
      return res.data;
    }
    
    // Otherwise create new
    const res = await reportsAPI.createSavedReport(selectedReportKey, {
      name: name.trim(),
      config: buildPayload(),
      isShared
    });
    await loadSavedReports();
    return res.data;
  }, [selectedReportKey, buildPayload, loadSavedReports, currentSavedReportId]);

  const loadSavedReport = useCallback((saved) => {
    if (!saved || !saved.reportKey) return;
    pendingSavedConfig.current = saved.config || null;
    setCurrentSavedReportId(saved._id);
    setSelectedReportKey(saved.reportKey);
  }, []);

  const loadSavedReportById = useCallback(async (reportId) => {
    try {
      const res = await reportsAPI.getSavedReport(reportId);
      const saved = res.data;
      if (saved && saved.reportKey) {
        pendingSavedConfig.current = saved.config || null;
        setCurrentSavedReportId(saved._id);
        setSelectedReportKey(saved.reportKey);
      }
    } catch (err) {
      console.error('Failed to load saved report:', err);
    }
  }, []);

  const deleteSaved = useCallback(async (id) => {
    await reportsAPI.deleteSavedReport(id);
    await loadSavedReports();
  }, [loadSavedReports]);

  return {
    reports,
    reportsLoading,
    reportsError,
    selectedReportKey,
    setSelectedReportKey,
    definition,
    definitionLoading,
    selectedFields,
    selectedFieldDefs,
    toggleField,
    moveField,
    filters,
    setFilters,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    sort,
    setSort,
    addSort,
    updateSort,
    removeSort,
    dateRange,
    setDateRange,
    preview,
    setPreview,
    runPreview,
    exporting,
    runExport,
    savedReports,
    savedReportsLoading,
    currentSavedReportId,
    setCurrentSavedReportId,
    saveReport,
    loadSavedReport,
    loadSavedReportById,
    loadSavedReports,
    deleteSaved,
    buildPayload,
    fieldMap
  };
}
