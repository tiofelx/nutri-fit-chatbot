import React from 'react';
import { useToastStore } from '../../store/toastStore';
import type { Toast as ToastItem, ToastType } from '../../store/toastStore';

const TYPE_STYLES: Record<ToastType, { bg: string; icon: string; label: string }> = {
  error: { bg: 'bg-red-900 border-red-700', icon: '✕', label: 'Erro' },
  warning: { bg: 'bg-yellow-900 border-yellow-700', icon: '⚠', label: 'Aviso' },
  info: { bg: 'bg-blue-900 border-blue-700', icon: 'ℹ', label: 'Info' },
};

function ToastItem({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const { bg, icon, label } = TYPE_STYLES[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm text-white shadow-lg ${bg} max-w-sm w-full`}
    >
      <span className="flex-shrink-0 font-bold" aria-hidden="true">{icon}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        aria-label={`Fechar ${label.toLowerCase()}`}
        className="flex-shrink-0 text-white/60 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
      >
        ✕
      </button>
    </div>
  );
}

export const Toast: React.FC = () => {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
