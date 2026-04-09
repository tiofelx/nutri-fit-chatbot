import React from 'react';

interface ChatHeaderProps {
  status: 'online' | 'streaming' | 'offline';
}

const STATUS_CONFIG = {
  online: { dot: 'bg-green-500', label: 'Online' },
  streaming: { dot: 'bg-teal-400', label: 'Digitando...' },
  offline: { dot: 'bg-red-400', label: 'Offline' },
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ status }) => {
  const { dot, label } = STATUS_CONFIG[status];

  return (
    <header
      className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white"
      role="banner"
      aria-label="Cabeçalho do NutriBot"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl" role="img" aria-label="planta">🌿</span>
        <span
          className="font-bold text-base"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          NutriBot
        </span>
      </div>

      <div
        className="flex items-center gap-1.5"
        role="status"
        aria-live="polite"
        aria-label={`Status: ${label}`}
      >
        <span className={`w-2 h-2 rounded-full ${dot} ${status === 'streaming' ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </header>
  );
};
