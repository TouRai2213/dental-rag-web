/**
 * Conversation API operations
 * CRUD operations for chat conversations using the t_evaluation table
 */

import { apiClient } from './client';
import type {
  Conversation,
  ConversationSummary,
  CreateChatMessageRequest,
  CreateChatMessageResponse,
  GetConversationRequest,
  GetConversationResponse,
  ListConversationsRequest,
  ListConversationsResponse,
  UpdateChatMessageRequest,
  UpdateChatMessageResponse,
  DeleteConversationRequest,
  DeleteConversationResponse,
} from '@/types/conversation';

/**
 * Conversation API endpoints
 */
const ENDPOINTS = {
  conversations: '/api/conversations',
  conversation: (sessionId: string) => `/api/conversations/${sessionId}`,
  messages: '/api/conversations/messages',
  message: (messageId: number) => `/api/conversations/messages/${messageId}`,
} as const;

/**
 * Generate a new session ID for conversations
 */
function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Conversation API class with all CRUD operations
 */
export class ConversationApi {
  /**
   * Get list of conversations for the authenticated user
   */
  async listConversations(params: Omit<ListConversationsRequest, 'account_id'> = {}): Promise<ConversationSummary[]> {
    const accountId = await apiClient.getAccountId();
    if (!accountId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `${ENDPOINTS.conversations}?${queryParams.toString()}`;
    const response = await apiClient.get<ListConversationsResponse>(endpoint);
    
    return response.conversations;
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(sessionId: string): Promise<Conversation> {
    const response = await apiClient.get<GetConversationResponse>(
      ENDPOINTS.conversation(sessionId)
    );
    
    return response.conversation;
  }

  /**
   * Create a new chat message (user input)
   * If no session_id provided, creates a new conversation
   */
  async createMessage(request: CreateChatMessageRequest): Promise<CreateChatMessageResponse> {
    const messageData = {
      ...request,
      session_id: request.session_id || generateSessionId(),
    };

    return await apiClient.post<CreateChatMessageResponse>(
      ENDPOINTS.messages,
      messageData
    );
  }

  /**
   * Update a chat message with AI response
   */
  async updateMessage(request: UpdateChatMessageRequest): Promise<UpdateChatMessageResponse> {
    return await apiClient.put<UpdateChatMessageResponse>(
      ENDPOINTS.message(request.id),
      request
    );
  }

  /**
   * Delete an entire conversation (all messages with the same session_id)
   */
  async deleteConversation(sessionId: string): Promise<void> {
    await apiClient.delete<DeleteConversationResponse>(
      ENDPOINTS.conversation(sessionId)
    );
  }

  /**
   * Send a complete chat message and get AI response
   * This combines createMessage + getting AI response in one operation
   */
  async sendChatMessage(userMessage: string, sessionId?: string): Promise<{
    sessionId: string;
    messageId: number;
    aiResponse: string;
  }> {
    // Create user message
    const createResponse = await this.createMessage({
      user_message: userMessage,
      session_id: sessionId,
      model_used: 'gpt-3.5-turbo', // Default model - should be configurable
    });

    // For now, we'll assume the AI response is handled by the backend
    // In a real implementation, this might trigger AI processing and return the response
    // The backend should update the record with the AI response
    
    return {
      sessionId: createResponse.session_id,
      messageId: createResponse.record.id,
      aiResponse: createResponse.record.ai_response || '', // Will be populated by backend
    };
  }

  /**
   * Start a new conversation
   * Returns a new session_id that can be used for subsequent messages
   */
  async startNewConversation(): Promise<string> {
    return generateSessionId();
  }

  /**
   * Get conversation statistics for the authenticated user
   */
  async getConversationStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
  }> {
    return await apiClient.get('/api/conversations/stats');
  }
}

// Export singleton instance
export const conversationApi = new ConversationApi();

/**
 * Utility functions
 */

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^chat_\d+_[a-z0-9]{9}$/.test(sessionId);
}

/**
 * Extract conversation title from first message
 */
export function getConversationTitle(conversation: Conversation): string {
  if (!conversation.messages.length) {
    return 'Empty Conversation';
  }

  const firstMessage = conversation.messages[0];
  const title = firstMessage.user_message.substring(0, 50);
  return title.length === 50 ? `${title}...` : title;
}

/**
 * Calculate total tokens for a conversation
 */
export function calculateConversationTokens(conversation: Conversation): number {
  return conversation.messages.reduce((total, message) => {
    return total + (message.input_tokens || 0) + (message.output_tokens || 0);
  }, 0);
}