/**
 * New Chat Page
 * Full-screen chat interface for new conversations
 */

'use client';

import { ChatInterface } from '@/components/chat/chat-interface';

export default function NewChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}