/**
 * React hook for conversation management
 * Provides state management and operations for chat conversations
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { conversationApi } from '@/lib/api/conversations';
import type {
  Conversation,
  ConversationSummary,
  ConversationLoadingState,
  ConversationError,
  UseConversationsReturn,
} from '@/types/conversation';

/**
 * Custom hook for managing conversations state and operations
 */
export function useConversations(): UseConversationsReturn {
  // NextAuth session for authentication
  const { data: session, status: sessionStatus } = useSession();

  // State management
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
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
      // Don't set error state for 404s to avoid showing error to user
      return;
    }
    
    console.error(`Conversation error${context ? ` in ${context}` : ''}:`, err);
    
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
   * Load user's conversations
   */
  const loadConversations = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }

    try {
      updateLoadingState('conversations', true);
      clearError();
      
      const userConversations = await conversationApi.listConversations({
        limit: 50, // Reasonable default limit
        offset: 0,
      });
      
      setConversations(userConversations);
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
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }

    try {
      updateLoadingState('currentConversation', true);
      clearError();
      
      const conversation = await conversationApi.getConversation(sessionId);
      setCurrentConversation(conversation);
    } catch (err) {
      handleError(err, 'loadConversation');
    } finally {
      updateLoadingState('currentConversation', false);
    }
  }, [session, sessionStatus, updateLoadingState, clearError, handleError]);

  /**
   * Send a message to a conversation
   */
  const sendMessage = useCallback(async (message: string, sessionId?: string): Promise<string> => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      throw new Error('User not authenticated');
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      updateLoadingState('sendingMessage', true);
      clearError();
      
      const result = await conversationApi.sendChatMessage(message.trim(), sessionId);
      
      // If this is a new conversation, refresh the conversation list
      if (!sessionId) {
        await loadConversations();
      }
      
      // If we're currently viewing this conversation, refresh it
      if (currentConversation?.session_id === result.sessionId) {
        await loadConversation(result.sessionId);
      }
      
      return result.sessionId;
    } catch (err) {
      handleError(err, 'sendMessage');
      throw err;
    } finally {
      updateLoadingState('sendingMessage', false);
    }
  }, [
    session,
    sessionStatus,
    currentConversation?.session_id,
    updateLoadingState,
    clearError,
    handleError,
    loadConversations,
    loadConversation,
  ]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (sessionId: string) => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }

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
  }, [
    session,
    sessionStatus,
    currentConversation?.session_id,
    updateLoadingState,
    clearError,
    handleError,
  ]);

  /**
   * Auto-load conversations when user is authenticated
   */
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user && conversations.length === 0) {
      loadConversations();
    }
  }, [sessionStatus, session, conversations.length, loadConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    error,
    loadConversations,
    loadConversation,
    sendMessage,
    deleteConversation,
    clearError,
  };
}

/**
 * Hook for managing a single conversation
 * Useful for conversation-specific pages
 */
export function useConversation(sessionId: string) {
  const { loadConversation, currentConversation, loading, error } = useConversations();

  useEffect(() => {
    if (sessionId) {
      loadConversation(sessionId);
    }
  }, [sessionId, loadConversation]);

  return {
    conversation: currentConversation,
    loading: loading.currentConversation,
    error,
  };
}