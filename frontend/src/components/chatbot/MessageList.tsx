import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 max-h-full space-y-1">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
