import { AlertCircle, RefreshCw, ServerOff, WifiOff, X } from 'lucide-react';

const styles = {
  network: {
    Icon: WifiOff,
    container: 'border-amber-400/40 bg-amber-500/10',
    icon: 'bg-amber-400/15 text-amber-300',
    title: 'text-amber-100',
  },
  maintenance: {
    Icon: ServerOff,
    container: 'border-amber-400/40 bg-amber-500/10',
    icon: 'bg-amber-400/15 text-amber-300',
    title: 'text-amber-100',
  },
  default: {
    Icon: AlertCircle,
    container: 'border-red-400/40 bg-red-500/10',
    icon: 'bg-red-400/15 text-red-300',
    title: 'text-red-100',
  },
};

const AuthErrorCard = ({ error, onDismiss, onRetry, isRetrying = false }) => {
  if (!error) return null;

  const style = styles[error.type] || styles.default;
  const Icon = style.Icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border p-4 shadow-lg backdrop-blur-sm ${style.container}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-2 ${style.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${style.title}`}>{error.title}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-200">{error.message}</p>
          {error.helpText && (
            <p className="mt-1.5 text-xs leading-5 text-gray-400">{error.helpText}</p>
          )}
          {error.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isRetrying ? 'Trying again...' : 'Try again'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Dismiss error message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default AuthErrorCard;
