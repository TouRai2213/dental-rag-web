/**
 * Individual Conversation Page
 * Loads and displays a specific conversation with its history
 */

'use client';

import { useEffect, useState } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { LoadingSpinner } from '@/components/loading-spinner';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ conversationId }) => {
      setConversationId(conversationId);
    });
  }, [params]);

  if (!conversationId) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ChatInterface conversationId={conversationId} />
      </div>
    </div>
  );
}