import { useContext } from 'react';
import { ToastContext } from './ToastProvider';
import type { ToastContextType } from './ToastProvider';

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext as React.Context<ToastContextType | undefined>);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx as ToastContextType;
};
