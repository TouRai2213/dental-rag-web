'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEnhancedConversations, type UseEnhancedConversationsReturn } from '@/hooks/use-enhanced-conversations';
import type { EnhancedConversationSummary } from '@/lib/conversation-utils';
import { ConversationItem } from './conversation-item';

interface SidebarProps {
  className?: string;
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  currentConversationId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Props for sharing conversations state
  conversations?: EnhancedConversationSummary[];
  isLoading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export function Sidebar({ 
  className = '', 
  onSelectConversation,
  onDeleteConversation, 
  currentConversationId, 
  isCollapsed = false, 
  onToggleCollapse,
  // External state props
  conversations: externalConversations,
  isLoading: externalIsLoading,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery
}: SidebarProps) {
  // Use external state if provided, otherwise fall back to internal hook
  const internalHook = useEnhancedConversations();
  
  const conversations = externalConversations ?? internalHook.filteredConversations;
  const isLoading = externalIsLoading ?? internalHook.isLoading;
  const searchQuery = externalSearchQuery ?? internalHook.searchQuery;
  const setSearchQuery = externalSetSearchQuery ?? internalHook.setSearchQuery;
  
  const filteredConversations = conversations;

  // Generate conversation title and preview using enhanced data
  const getConversationTitle = (conversation: any) => {
    // Use enhanced title if available
    if (conversation.enhancedTitle) {
      return conversation.enhancedTitle;
    }
    
    // Fallback to original logic for compatibility
    if (conversation.patient_name) {
      return `${conversation.patient_name}の分析`;
    }
    
    if (conversation.first_message) {
      return conversation.first_message.length > 30 
        ? `${conversation.first_message.substring(0, 30)}...`
        : conversation.first_message;
    }
    
    return `分析 ${new Date(conversation.created_at).toLocaleDateString('ja-JP')}`;
  };

  const getConversationPreview = (conversation: any) => {
    // Use enhanced preview if available
    if (conversation.enhancedPreview) {
      return conversation.enhancedPreview;
    }
    
    // Fallback to original logic
    if (conversation.patient_condition) {
      return conversation.patient_condition;
    }
    return conversation.last_message || '新しい会話';
  };

  // Get conversation keywords for display
  const getConversationKeywords = (conversation: any) => {
    if (!conversation.keywords) return [];
    
    const keywords = [];
    const { diagnosis, medicalTerms, age, gender } = conversation.keywords;
    
    if (age) keywords.push(age);
    if (gender) keywords.push(gender);
    if (diagnosis && diagnosis.length > 0) {
      keywords.push(...diagnosis.slice(0, 2));
    }
    if (medicalTerms && medicalTerms.length > 0) {
      keywords.push(...medicalTerms.slice(0, 2));
    }
    
    return keywords.slice(0, 4); // Limit to 4 keywords for display
  };

  // Collapsed state - only show toggle button
  if (isCollapsed) {
    return (
      <div className={`absolute top-4 left-4 z-10 ${className}`}>
        <button 
          onClick={onToggleCollapse}
          className="flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 h-[42px] w-[42px] transition-colors duration-200 group shadow-md"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Search Section */}
      <div className="p-4">
        
        {/* Search */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md h-[42px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 h-full w-full bg-transparent border-0 focus:outline-none focus:ring-0 rounded-md"
            />
          </div>
          {/* Collapse button */}
          <button 
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 h-[42px] w-[42px] transition-colors duration-200 group"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredConversations.map((conversation, index) => (
              <ConversationItem
                key={conversation.session_id}
                conversation={conversation}
                currentConversationId={currentConversationId}
                onSelectConversation={onSelectConversation}
                onDeleteConversation={onDeleteConversation}
                getConversationTitle={getConversationTitle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}