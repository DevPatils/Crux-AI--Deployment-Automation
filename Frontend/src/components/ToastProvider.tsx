import React, { useCallback, useState } from 'react';
import { ToastContext } from './ToastProviderInternal';
import type { ToastContextType } from './ToastProviderInternal';
// Re-export context/type so other modules can import from this file
export { ToastContext };
export type { ToastContextType };

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' | 'warning'; duration?: number };

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, opts?: Partial<Toast>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 9);
    const toast: Toast = {
      id,
      message,
      type: opts?.type || 'info',
      duration: opts?.duration ?? 4000,
    };
    setToasts((t) => [...t, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss } as ToastContextType}>
      {children}

      {/* Toast container */}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg text-sm text-left ${t.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : t.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-white border border-gray-200 text-gray-900'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">{t.message}</div>
              <button onClick={() => dismiss(t.id)} className="text-gray-500 hover:text-gray-700 ml-2">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
