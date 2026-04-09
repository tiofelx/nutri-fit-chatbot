import React, { useRef, useState, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isStreaming }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // max 4 lines ≈ 4 * 24px line-height + padding
    const maxHeight = 4 * 24 + 24;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    resizeTextarea();
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white" role="region" aria-label="Área de entrada de mensagem">
      {isStreaming && (
        <div className="flex items-center gap-1.5 mb-2 px-1" role="status" aria-live="polite">
          <span className="text-xs text-gray-700">digitando</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-teal-400"
                style={{ animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
            ))}
          </span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="chat-input" className="sr-only">Mensagem para o NutriBot</label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Digite sua mensagem..."
          rows={1}
          aria-label="Mensagem para o NutriBot"
          aria-disabled={isStreaming}
          className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-gray-900
            bg-gray-100 border border-gray-200 outline-none
            placeholder-gray-500 leading-6 overflow-y-auto
            transition-colors duration-150 focus:border-teal-400
            disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: `${4 * 24 + 24}px` }}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !value.trim()}
          aria-label="Enviar mensagem"
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #00d4aa, #7c3aed)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }`}</style>
    </div>
  );
};
