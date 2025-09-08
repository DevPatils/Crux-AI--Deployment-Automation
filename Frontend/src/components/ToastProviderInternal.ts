import { createContext } from 'react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' | 'warning'; duration?: number };

export type ToastContextType = {
  push: (message: string, opts?: Partial<Toast>) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
