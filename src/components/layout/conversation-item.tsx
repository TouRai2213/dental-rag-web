'use client';

import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import type { EnhancedConversationSummary } from '@/lib/conversation-utils';

interface ConversationItemProps {
  conversation: EnhancedConversationSummary;
  currentConversationId?: string;
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  getConversationTitle: (conversation: any) => string;
}

export function ConversationItem({
  conversation,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  getConversationTitle
}: ConversationItemProps) {
  const isActive = conversation.session_id === currentConversationId;
  
  const handleClick = () => {
    onSelectConversation?.(conversation.session_id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation?.(conversation.session_id);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return '今日';
      } else if (diffDays === 2) {
        return '昨日';
      } else if (diffDays <= 7) {
        return `${diffDays - 1}日前`;
      } else {
        return date.toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`
        relative group rounded-lg p-3 cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
        }
      `}
      onClick={handleClick}
    >
      {/* Main content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          {/* Title */}
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
            {getConversationTitle(conversation)}
          </div>
          
          {/* Date */}
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(conversation.updated_at)}
          </div>
        </div>

        {/* Delete button - shows on hover */}
        {onDeleteConversation && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}