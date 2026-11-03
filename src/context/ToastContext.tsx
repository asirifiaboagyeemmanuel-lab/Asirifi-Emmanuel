import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, FileText, Download } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
  iconType?: 'check' | 'pdf' | 'sheet';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  showSuccessToast: (title: string, message?: string, iconType?: 'check' | 'pdf' | 'sheet') => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      title,
      message,
      iconType,
      action,
      duration = 4500,
    }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, iconType, action, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccessToast = useCallback(
    (title: string, message?: string, iconType: 'check' | 'pdf' | 'sheet' = 'check') => {
      showToast({
        type: 'success',
        title,
        message,
        iconType,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccessToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isPdf = toast.iconType === 'pdf';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 shadow-xl border border-slate-700/80 flex items-start gap-3.5"
            role="status"
          >
            {/* Icon */}
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                isPdf
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              }`}
            >
              {isPdf ? (
                <Download className="w-4 h-4 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>{toast.title}</span>
              </h5>
              {toast.message && (
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed break-words">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onClose(toast.id);
                  }}
                  className="mt-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => onClose(toast.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
