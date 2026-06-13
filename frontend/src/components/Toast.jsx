import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Toast notification component.
 * Supports success, error, and info types with auto-dismiss.
 */
function ToastItem({ toast, onDismiss }) {
  const icons = {
    success: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const styles = {
    success: 'border-success text-success bg-success/10',
    error: 'border-error text-error bg-error/10',
    info: 'border-info text-info bg-info/10',
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        shadow-lg max-w-sm w-full
        ${styles[toast.type] || styles.info}
        ${toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium flex-1 text-text-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Kapat"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * ToastProvider wraps the app and provides toast notification functionality.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    // Mark toast as exiting to trigger exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message, type = 'info') => {
      const id = ++toastIdCounter;
      const toast = { id, message, type, exiting: false };

      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 5000);

      return id;
    },
    [dismissToast]
  );

  const toast = useMemo(
    () => ({
      success: (message) => addToast(message, 'success'),
      error: (message) => addToast(message, 'error'),
      info: (message) => addToast(message, 'info'),
    }),
    [addToast]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = { toast, addToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - fixed top-right */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to access toast notifications.
 * Returns { toast } with .success(), .error(), .info() methods.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
