/**
 * API exports - central import point for all API functionality
 */

// Core API client
export { apiClient, ApiClient, ApiClientError } from './client';

// Conversation API
export { conversationApi, ConversationApi, isValidSessionId, getConversationTitle, calculateConversationTokens } from './conversations';

// Re-export types for convenience
export type {
  ApiType,
  ReportType,
  TEvaluationRecord,
  ChatMessage,
  Conversation,
  ConversationSummary,
  ConversationLoadingState,
  ConversationError,
  UseConversationsReturn,
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