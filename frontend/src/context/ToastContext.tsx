import React, { createContext, useContext, useState, useCallback } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(({ title, description, type = 'info', duration = 3500 }: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'error':
        return <AlertOctagon size={16} style={{ color: 'var(--color-critical)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--color-info)' }} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            duration={toast.duration}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-popover)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              minWidth: '280px',
              maxWidth: '380px',
              position: 'relative',
              animation: 'fadeIn 180ms ease-out',
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(toast.type || 'info')}</div>
            <div style={{ flexGrow: 1 }}>
              <RadixToast.Title
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  lineHeight: 1.3,
                }}
              >
                {toast.title}
              </RadixToast.Title>
              {toast.description && (
                <RadixToast.Description
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-ink-secondary)',
                    marginTop: '2px',
                    lineHeight: 1.4,
                  }}
                >
                  {toast.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close
              style={{
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <X size={14} />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 'var(--z-toast)',
            maxWidth: '100vw',
            margin: 0,
            listStyle: 'none',
            outline: 'none',
          }}
        />
      </RadixToast.Provider>
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
