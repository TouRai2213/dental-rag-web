/**
 * Chat Header Component
 * Header for chat interface with brand logo and new conversation button
 */

'use client';

import React from 'react';
import { Plus, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  className?: string;
  onNewConversation?: () => void;
}

export function ChatHeader({ className = '', onNewConversation }: ChatHeaderProps) {
  const router = useRouter();

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      // Default behavior: navigate to new chat page
      router.push('/chat/new');
    }
  };

  return (
    <header className={`flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900 ${className}`}>
      {/* Brand/Logo */}
      <div className="flex items-center space-x-2">
        <Brain className="w-6 h-6 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dental Brain
        </h1>
      </div>

      {/* New Conversation Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNewConversation}
        className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Start new conversation"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </header>
  );
}

export default ChatHeader;