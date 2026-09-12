import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const titleId = useId();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (size === 'drawer') {
    return (
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 top-16 z-40 flex flex-col overflow-hidden bg-white shadow-2xl transition-[left] duration-200 lg:left-[var(--sidebar-width)]"
        role="dialog"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
          <h3 id={titleId} className="text-lg font-semibold text-white">{title}</h3>
          <button
            aria-label="Close"
            className="rounded-md p-2 text-white transition-colors hover:bg-white hover:bg-opacity-20"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-5xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-7xl'
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 z-[9999] flex items-center justify-center overflow-hidden p-2 transition-[left] duration-200 sm:p-4 lg:left-[var(--sidebar-width)]">
      <button
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-gray-950/55"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative flex max-h-[calc(100vh-5rem)] min-h-0 w-full ${sizeClasses[size] || sizeClasses.md} flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl`}
        role="dialog"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
          <h3 id={titleId} className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h3>
          <button
            aria-label="Close"
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
