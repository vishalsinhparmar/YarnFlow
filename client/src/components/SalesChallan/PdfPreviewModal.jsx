import { useEffect, useId } from 'react';
import { Download, FileText, LoaderCircle, X } from 'lucide-react';

const PdfPreviewModal = ({
  isOpen,
  url,
  title,
  reference,
  description,
  onClose,
  onDownload,
  downloading = false
}) => {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !url) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 z-[60] flex items-center justify-center overflow-hidden p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
      <button
        type="button"
        aria-label="Close PDF preview"
        className="absolute inset-0 cursor-default bg-gray-950/65 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl"
      >
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 id={titleId} className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                  {title}
                </h2>
                <span className="hidden flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 sm:inline">
                  PDF
                </span>
              </div>
              <p id={descriptionId} className="truncate text-xs text-gray-500 sm:text-sm">
                {description}
                {reference ? ` - ${reference}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {downloading ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Download aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{downloading ? 'Preparing' : 'Download'}</span>
            </button>
            <button
              type="button"
              aria-label="Close PDF preview"
              title="Close"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-gray-200 p-1.5 sm:p-3">
          <iframe
            src={url}
            className="h-full w-full border-0 bg-white shadow-inner"
            title={`${title} preview`}
          />
        </div>
      </section>
    </div>
  );
};

export default PdfPreviewModal;
