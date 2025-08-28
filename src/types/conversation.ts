/**
 * TypeScript interfaces for t_evaluation table and conversation management
 * Based on the existing business database structure
 */

// API types that correspond to t_evaluation.api_type column
export type ApiType = 'upload' | 'generate_report' | 'chat' | 'literature_search' | 'update_additional_data';

// Report types for generate_report API calls
export type ReportType = 'patient' | 'gp' | 'specialist';

/**
 * Full t_evaluation table record interface
 * Matches the MySQL table schema exactly
 */
export interface TEvaluationRecord {
  id: number;
  rid?: number | null;
  account_id?: string | null;
  session_id?: string | null;
  api_type?: ApiType | null;
  report_type?: ReportType | null;
  report_content?: string | null;
  user_message?: string | null;
  ai_response?: string | null;
  request_data?: string | null;
  response_data?: string | null;
  model_used?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  created_at?: string | null; // ISO datetime string
  updated_at?: string | null; // ISO datetime string
}

/**
 * Chat message interface for conversation display
 * Extracted from t_evaluation records where api_type = 'chat'
 */
export interface ChatMessage {
  id: number;
  user_message: string;
  ai_response: string;
  model_used?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  created_at: string; // ISO datetime string
}

/**
 * Conversation interface representing a grouped chat session
 * Groups multiple chat messages by session_id
 */
export interface Conversation {
  session_id: string;
  account_id: string;
  messages: ChatMessage[];
  created_at: string; // First message timestamp
  updated_at: string; // Last message timestamp
  total_input_tokens: number;
  total_output_tokens: number;
  message_count: number;
}

/**
 * Conversation summary for list views
 * Lightweight version without full message content
 */
export interface ConversationSummary {
  session_id: string;
  account_id: string;
  title?: string; // Derived from first user message
  preview?: string; // First few words of first message
  message_count: number;
  created_at: string;
  updated_at: string;
  total_tokens: number;
}

/**
 * Request/Response interfaces for API operations
 */

// Create new chat message
export interface CreateChatMessageRequest {
  session_id?: string; // Optional - will be generated if not provided
  user_message: string;
  model_used?: string;
}

export interface CreateChatMessageResponse {
  record: TEvaluationRecord;
  session_id: string;
}

// Get conversation messages
export interface GetConversationRequest {
  session_id: string;
}

export interface GetConversationResponse {
  conversation: Conversation;
}

// List user conversations
export interface ListConversationsRequest {
  account_id: string;
  limit?: number;
  offset?: number;
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  total: number;
  has_more: boolean;
}

// Update chat message (for AI response)
export interface UpdateChatMessageRequest {
  id: number;
  ai_response: string;
  model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
}

export interface UpdateChatMessageResponse {
  record: TEvaluationRecord;
}

// Delete conversation
export interface DeleteConversationRequest {
  session_id: string;
}

export interface DeleteConversationResponse {
  deleted: boolean;
  deleted_count: number;
}

/**
 * Frontend-specific interfaces
 */

// Loading states for UI
export interface ConversationLoadingState {
  conversations: boolean;
  currentConversation: boolean;
  sendingMessage: boolean;
  deletingConversation: boolean;
}

// Error states
export interface ConversationError {
  message: string;
  code?: string;
  field?: string;
}

// Hook return types
export interface UseConversationsReturn {
  conversations: ConversationSummary[];
  currentConversation: Conversation | null;
  loading: ConversationLoadingState;
  error: ConversationError | null;
  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (sessionId: string) => Promise<void>;
  sendMessage: (message: string, sessionId?: string) => Promise<string>;
  deleteConversation: (sessionId: string) => Promise<void>;
  clearError: () => void;
}