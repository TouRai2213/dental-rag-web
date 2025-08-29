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
 * RAG Chat API Types
 * Types for the dental cephalometric analysis chat endpoints
 */

// Analysis types supported by the backend
export type AnalysisType = 'comprehensive' | 'osa_risk' | 'orthodontic';

// Intelligent chat request (matches backend POST /api/chat/intelligent)
export interface IntelligentChatRequest {
  message: string;
  conversation_id?: string;
  patient_data?: PatientData | null;
  previous_response_id?: string;
}

// Intelligent chat response
export interface IntelligentChatResponse {
  conversation_id: string;
  response: string;
  literature_references?: LiteratureReference[];
}

// Patient demographic data
export interface PatientData {
  name?: string;
  age?: number;
  gender?: 'male' | 'female';
  ethnicity?: string;
  measurements?: Record<string, number>;
  clinical_significance?: Record<string, string>;
}

// RAG chat analyze request (matches backend POST /api/chat/analyze)
export interface RagChatAnalyzeRequest {
  message: string;
  conversation_id?: string;
  analysis_type: AnalysisType;
  include_meta_analysis: boolean;
  include_rag_search: boolean;
  patient_data?: PatientData;
}

// RAG chat analyze response
export interface RagChatAnalyzeResponse {
  conversation_id: string;
  response: string;
  meta_analysis_results?: any[];
  literature_references?: LiteratureReference[];
}

// Literature reference structure
export interface LiteratureReference {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  relevance_score?: number;
  excerpt?: string;
}

// Excel upload request
export interface ExcelUploadRequest {
  file: File;
}

// Excel upload response
export interface ExcelUploadResponse {
  success: boolean;
  patient_data: PatientData;
  message: string;
}

// Literature detail response
export interface LiteratureDetailResponse {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract?: string;
  full_text?: string;
  doi?: string;
  pmid?: string;
  keywords?: string[];
  categories?: string[];
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
  uploadingExcel: boolean;
  analyzingMessage: boolean;
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