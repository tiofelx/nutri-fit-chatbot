import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../types';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useChat() {
  const { addMessage, appendDelta, setStreaming } = useChatStore();

  const sendMessage = async (sessionId: string, message: string): Promise<void> => {
    // Add empty assistant message placeholder with isStreaming flag
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    addMessage(assistantMsg);
    setStreaming(true);

    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let parsed: { delta?: string; done?: boolean; error?: string };
            try {
              parsed = JSON.parse(raw);
            } catch {
              continue;
            }

            if (parsed.error === 'timeout' || parsed.error === 'llm_unavailable') {
              const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content:
                  parsed.error === 'timeout'
                    ? 'O assistente demorou muito para responder. Por favor, tente novamente.'
                    : 'O assistente está temporariamente indisponível. Tente novamente em instantes.',
                timestamp: new Date(),
                isStreaming: false,
              };
              // Replace the empty placeholder with the error message
              addMessage(errorMsg);
              setStreaming(false);
              return;
            }

            if (parsed.delta) {
              appendDelta(parsed.delta);
            }

            if (parsed.done) {
              // Mark last assistant message as no longer streaming
              useChatStore.setState((state) => {
                const messages = [...state.messages];
                const last = messages[messages.length - 1];
                if (last && last.role === 'assistant') {
                  messages[messages.length - 1] = { ...last, isStreaming: false };
                }
                return { messages };
              });
              setStreaming(false);
              return;
            }
          }
        }

        // Stream ended without done signal — finalize anyway
        useChatStore.setState((state) => {
          const messages = [...state.messages];
          const last = messages[messages.length - 1];
          if (last && last.role === 'assistant') {
            messages[messages.length - 1] = { ...last, isStreaming: false };
          }
          return { messages };
        });
        setStreaming(false);
        return;
      } catch (err) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          // All retries exhausted — show friendly error
          const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Não foi possível conectar ao servidor após várias tentativas. Verifique sua conexão e tente novamente.',
            timestamp: new Date(),
            isStreaming: false,
          };
          addMessage(errorMsg);
          setStreaming(false);
          return;
        }
        // Exponential backoff: 1s, 2s, 4s
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  };

  return { sendMessage };
}
