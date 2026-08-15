export const paginatePreview = (page = 1, limit = 50) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit
  };
};

export const parsePreviewResult = (result = {}) => {
  const total = result.total?.[0]?.count || 0;
  const data = result.data || [];
  return { total, data };
};
