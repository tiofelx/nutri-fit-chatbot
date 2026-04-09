import React, { useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { ProfileSummary } from './ProfileSummary';
import { MessageList } from './MessageList';
import { DisclaimerBanner } from './DisclaimerBanner';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../../store/chatStore';
import { useSessionStore } from '../../store/sessionStore';
import { useProfileStore } from '../../store/profileStore';
import { useToastStore } from '../../store/toastStore';
import { useChat } from '../../hooks/useChat';
import type { ChatMessage } from '../../types';

const WELCOME_MESSAGE = 'Olá! 👋 Sou o NutriBot, seu assistente de nutrição e fitness. Para começar, qual é o seu objetivo principal? (ex: perda de peso, ganho de massa muscular, manutenção ou melhora do condicionamento)';

export const ChatbotPage: React.FC = () => {
  const { messages, isStreaming, addMessage } = useChatStore();
  const { sessionId, setSessionId } = useSessionStore();
  const { profile } = useProfileStore();
  const { sendMessage } = useChat();
  const { addToast } = useToastStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Create session in backend
    fetch('/api/session', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.sessionId) {
          setSessionId(data.sessionId);
          // Sync welcome message to backend session so LLM has full context
          fetch('/api/session/' + data.sessionId + '/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'assistant', content: WELCOME_MESSAGE }),
          }).catch(() => {});
        } else {
          addToast('Não foi possível criar a sessão. O histórico pode não ser salvo.', 'warning');
        }
      })
      .catch(() => {
        addToast('Falha ao conectar ao servidor. Verifique sua conexão e recarregue a página.', 'error');
      });

    // Add welcome message to UI
    const welcome: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    };
    addMessage(welcome);
  }, [addMessage, setSessionId, addToast]);

  const handleSend = (message: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    if (sessionId) {
      sendMessage(sessionId, message);
    }
  };

  const status = isStreaming ? 'streaming' : 'online';

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Container centralizado — header + chat alinhados */}
      <div className="flex flex-col flex-1 overflow-hidden w-full max-w-2xl mx-auto border-x border-gray-100">
        <ChatHeader status={status} />
        <ProfileSummary profile={profile} />
        <main
          className="flex flex-col flex-1 overflow-hidden bg-gray-50"
          aria-label="Conversa com NutriBot"
          role="main"
        >
          <MessageList messages={messages} />
        </main>
        <DisclaimerBanner />
        <ChatInput onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
};
