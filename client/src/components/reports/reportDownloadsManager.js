// Shared download history management
let globalDownloads = [];
let globalSetDownloads = null;

export const addReportDownload = (reportName, module, dateRange, filename) => {
  const newDownload = {
    id: Date.now(),
    reportName,
    module,
    dateRange,
    generatedAt: new Date().toLocaleString('en-IN'),
    filename,
    timestamp: Date.now()
  };
  
  globalDownloads = [newDownload, ...globalDownloads];
  localStorage.setItem('reportDownloads', JSON.stringify(globalDownloads));
  
  if (globalSetDownloads) {
    globalSetDownloads([...globalDownloads]);
  }
  
  return newDownload;
};

export const setGlobalDownloadsSetter = (setter) => {
  globalSetDownloads = setter;
};

export const getGlobalDownloads = () => globalDownloads;

export const setGlobalDownloads = (downloads) => {
  globalDownloads = downloads;
};

export const getReportDownloads = () => {
  const stored = localStorage.getItem('reportDownloads');
  if (stored) {
    globalDownloads = JSON.parse(stored);
  }
  return globalDownloads;
};

export const removeReportDownload = (id) => {
  globalDownloads = globalDownloads.filter(d => d.id !== id);
  localStorage.setItem('reportDownloads', JSON.stringify(globalDownloads));
  
  if (globalSetDownloads) {
    globalSetDownloads([...globalDownloads]);
  }
};

export const clearAllDownloads = () => {
  globalDownloads = [];
  localStorage.removeItem('reportDownloads');
  
  if (globalSetDownloads) {
    globalSetDownloads([]);
  }
};
