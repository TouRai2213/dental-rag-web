/**
 * Enhanced conversations hook with keyword extraction and intelligent titling
 * 增强的会话管理hook，支持关键词提取和智能标题生成
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { conversationApi } from '@/lib/api/conversations';
import { 
  enhanceConversationSummary, 
  type EnhancedConversationSummary 
} from '@/lib/conversation-utils';
import type {
  Conversation,
  ConversationSummary,
  ConversationLoadingState,
  ConversationError,
} from '@/types/conversation';

export interface UseEnhancedConversationsReturn {
  conversations: EnhancedConversationSummary[];
  filteredConversations: EnhancedConversationSummary[];
  currentConversation: Conversation | null;
  loading: ConversationLoadingState;
  error: ConversationError | null;
  isLoading: boolean; // 兼容现有代码
  
  // 搜索和过滤
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Array<{
    message_id: number;
    session_id: string;
    user_message: string;
    ai_response: string;
    created_at: string;
    conversation_title: string;
    match_in: string[];
  }>;
  isSearching: boolean;
  
  // CRUD操作
  loadConversations: () => Promise<void>;
  loadConversation: (sessionId: string) => Promise<void>;
  deleteConversation: (sessionId: string) => Promise<void>;
  
  // 工具函数
  clearError: () => void;
  refreshConversations: () => Promise<void>;
}

/**
 * 增强的会话管理Hook
 */
export function useEnhancedConversations(): UseEnhancedConversationsReturn {
  // NextAuth session for authentication
  const { data: session, status: sessionStatus } = useSession();

  // State management
  const [conversations, setConversations] = useState<EnhancedConversationSummary[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    message_id: number;
    session_id: string;
    user_message: string;
    ai_response: string;
    created_at: string;
    conversation_title: string;
    match_in: string[];
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState<ConversationLoadingState>({
    conversations: false,
    currentConversation: false,
    sendingMessage: false,
    deletingConversation: false,
    uploadingExcel: false,
    analyzingMessage: false,
  });
  const [error, setError] = useState<ConversationError | null>(null);

  /**
   * Update specific loading state
   */
  const updateLoadingState = useCallback((key: keyof ConversationLoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Handle and set errors
   */
  const handleError = useCallback((err: any, context?: string) => {
    // Silently handle 404 errors (API not implemented yet)
    if (err?.status === 404) {
      console.log('API endpoint not found - backend may not be running');
      return;
    }
    
    console.error(`Enhanced conversation error${context ? ` in ${context}` : ''}:`, err);
    
    const errorMessage = err?.message || 'An unexpected error occurred';
    setError({
      message: errorMessage,
      code: err?.code,
      field: err?.field,
    });
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load user's conversations with enhancement
   */
  const loadConversations = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }

    try {
      updateLoadingState('conversations', true);
      clearError();
      
      const userConversations = await conversationApi.listConversations({
        limit: 50,
        offset: 0,
      });
      
      // 增强每个会话摘要
      const enhancedConversations = userConversations.map(conv => 
        enhanceConversationSummary(conv)
      );
      
      setConversations(enhancedConversations);
    } catch (err) {
      handleError(err, 'loadConversations');
    } finally {
      updateLoadingState('conversations', false);
    }
  }, [session, sessionStatus, updateLoadingState, clearError, handleError]);

  /**
   * Load a specific conversation with messages
   */
  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      updateLoadingState('currentConversation', true);
      clearError();
      
      const conversation = await conversationApi.getConversation(sessionId);
      setCurrentConversation(conversation);
      
      // 重新增强相应的会话摘要（如果有消息的话）
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.session_id === sessionId 
            ? enhanceConversationSummary(conv, conversation.messages)
            : conv
        )
      );
      
    } catch (err) {
      handleError(err, 'loadConversation');
    } finally {
      updateLoadingState('currentConversation', false);
    }
  }, [updateLoadingState, clearError, handleError]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (sessionId: string) => {
    try {
      updateLoadingState('deletingConversation', true);
      clearError();
      
      await conversationApi.deleteConversation(sessionId);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.session_id !== sessionId));
      
      // Clear current conversation if it was deleted
      if (currentConversation?.session_id === sessionId) {
        setCurrentConversation(null);
      }
      
    } catch (err) {
      handleError(err, 'deleteConversation');
    } finally {
      updateLoadingState('deletingConversation', false);
    }
  }, [currentConversation, updateLoadingState, clearError, handleError]);

  /**
   * Refresh conversations
   */
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  /**
   * Load conversations on mount and session change
   */
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadConversations();
    }
  }, [sessionStatus, loadConversations]);

  /**
   * 执行全局消息搜索
   */
  const performGlobalSearch = useCallback(async (query: string) => {
    if (!query.trim() || sessionStatus !== 'authenticated') {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      clearError();
      
      const results = await conversationApi.searchMessages(query, 50);
      setSearchResults(results.results);
      
    } catch (err: any) {
      console.error('Search error:', err);
      handleError(err, 'performGlobalSearch');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [sessionStatus, clearError, handleError]);

  // 搜索查询变化时执行搜索（防抖）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performGlobalSearch(searchQuery);
    }, 300); // 300ms防抖

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performGlobalSearch]);

  /**
   * 智能搜索过滤
   * 当有搜索查询时，显示匹配的会话（基于全局搜索结果）
   * 否则显示所有会话
   */
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    
    // 如果有搜索结果，从中提取匹配的会话
    if (searchResults.length > 0) {
      const matchedSessionIds = new Set(searchResults.map(result => result.session_id));
      return conversations.filter(conv => matchedSessionIds.has(conv.session_id));
    }
    
    // 如果没有搜索结果但有查询，返回空数组
    return [];
  }, [conversations, searchQuery, searchResults]);

  // 兼容性：isLoading
  const isLoading = loading.conversations;

  return {
    conversations,
    filteredConversations,
    currentConversation,
    loading,
    error,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    loadConversations,
    loadConversation,
    deleteConversation,
    clearError,
    refreshConversations,
  };
}