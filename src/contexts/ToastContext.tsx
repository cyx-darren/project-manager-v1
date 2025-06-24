import React, { createContext, useContext, type ReactNode } from 'react';
import { useToast, type UseToastReturn } from '../hooks/useToast';

interface ToastContextProps {
  children: ReactNode;
}

const ToastContext = createContext<UseToastReturn | undefined>(undefined);

export const ToastProvider: React.FC<ToastContextProps> = ({ children }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): UseToastReturn => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}; 