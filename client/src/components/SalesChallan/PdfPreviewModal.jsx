import { useEffect, useId, useState } from 'react';
import { Download, FileText, LoaderCircle, X, ZoomIn, ZoomOut, Eye } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className={`fixed z-[9999] flex items-center justify-center transition-all duration-200 ${
      isFullscreen 
        ? 'inset-0 bg-gray-950/70 backdrop-blur-md' 
        : 'bottom-0 left-0 right-0 top-16 bg-gray-950/60 backdrop-blur-sm lg:left-[var(--sidebar-width)]'
    }`}>
      <button
        type="button"
        aria-label="Close PDF preview"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${
          isFullscreen
            ? 'h-screen w-screen'
            : 'h-full min-h-0 w-full max-w-6xl'
        }`}
      >
        {/* Premium Header */}
        <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            {/* Icon with gradient background */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <FileText aria-hidden="true" className="h-6 w-6" />
            </div>

            {/* Title and metadata */}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-3">
                <h2 id={titleId} className="truncate text-base font-bold text-gray-900 sm:text-lg">
                  {title}
                </h2>
                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Eye className="h-3 w-3" />
                  PDF
                </span>
              </div>
              <p id={descriptionId} className="mt-1 truncate text-sm text-gray-600">
                {description}
                {reference && <span className="font-medium text-gray-900"> • {reference}</span>}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Download button */}
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
            >
              {downloading ? (
                <>
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Preparing...</span>
                </>
              ) : (
                <>
                  <Download aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isFullscreen ? (
                <ZoomOut aria-hidden="true" className="h-5 w-5" />
              ) : (
                <ZoomIn aria-hidden="true" className="h-5 w-5" />
              )}
            </button>

            {/* Close button */}
            <button
              type="button"
              aria-label="Close PDF preview"
              title="Close (Esc)"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* PDF Viewer Container */}
        <div className="min-h-0 flex-1 bg-gradient-to-b from-gray-100 to-gray-200 p-2 sm:p-4">
          <div className="h-full w-full overflow-hidden rounded-lg bg-white shadow-inner">
            <iframe
              src={url}
              className="h-full w-full border-0"
              title={`${title} preview`}
            />
          </div>
        </div>

        {/* Footer with document info */}
        <footer className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span>Document ready for download</span>
          </div>
          <span className="text-gray-500">Press <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">Esc</kbd> to close</span>
        </footer>
      </section>
    </div>
  );
};

export default PdfPreviewModal;
