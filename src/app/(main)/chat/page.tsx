/**
 * Main Chat Page
 * Entry point for chat functionality - redirects to new chat or shows conversation list
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  // Redirect to new chat page for now
  // In the future, this could show a conversation list or recent chats
  useEffect(() => {
    router.replace('/chat/new');
  }, [router]);

  // Fallback UI while redirecting
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dental Cephalometric Analysis</h1>
        <div className="text-center text-muted-foreground">
          Redirecting to new conversation...
        </div>
      </div>
    </div>
  );
}