/**
 * Chat Interface Component
 * Main chat interface component that orchestrates the entire conversation experience
 * Combines message list, input, patient data, and analysis results
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileSpreadsheet, Brain, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { PatientDataUpload } from './patient-data-upload';
import { MetaAnalysisResults } from './meta-analysis-results';
import { LiteratureReferences } from './literature-references';
import { conversationApi } from '@/lib/api/conversations';
import { usePatientData } from '@/hooks/use-patient-data';
import type { 
  ChatMessage,
  RagChatAnalyzeResponse,
  IntelligentChatResponse,
  AnalysisType,
  LiteratureReference
} from '@/types/conversation';

/**
 * Helper function to determine if a message requires cephalometric analysis
 * Returns true if the message appears to be asking for analysis, report generation, or clinical assessment
 */
function isAnalysisRequest(message: string): boolean {
  const analysisKeywords = [
    'analysis', 'analyze', 'assessment', 'evaluate', 'report', 
    'cephalometric', 'measurement', 'orthodontic', 'OSA', 'risk',
    'comprehensive', 'clinical', 'diagnosis', 'treatment',
    '分析', '評価', '診断', '治療', '測定'
  ];
  
  const lowerMessage = message.toLowerCase();
  return analysisKeywords.some(keyword => lowerMessage.includes(keyword));
}

interface ChatInterfaceProps {
  conversationId?: string;
  className?: string;
}

interface EnhancedChatMessage extends ChatMessage {
  meta_analysis_results?: any[];
  literature_references?: LiteratureReference[];
}

type ChatState = 'idle' | 'patient_data' | 'chatting' | 'analyzing';

export function ChatInterface({ conversationId, className = '' }: ChatInterfaceProps) {
  // State management
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('comprehensive');

  // Patient data hook
  const { 
    patientData, 
    hasData: hasPatientData, 
    isLoading: patientDataLoading, 
    error: patientDataError, 
    uploadProgress, 
    uploadExcelFile, 
    clearPatientData, 
    updatePatientData, 
    clearError: clearPatientDataError, 
    preview 
  } = usePatientData();
  console.log('[ChatInterface] Current hook state:', { hasPatientData, patientName: patientData?.name });

  // Auto-start analysis when patient data is loaded
  const [hasTriggeredAutoAnalysis, setHasTriggeredAutoAnalysis] = useState(false);

  // Debug: Track hasPatientData changes in chat interface
  useEffect(() => {
    console.log('[ChatInterface] hasPatientData changed:', {
      hasPatientData,
      patientData: patientData?.name,
      chatState,
      hasTriggeredAutoAnalysis
    });
  }, [hasPatientData, patientData, chatState, hasTriggeredAutoAnalysis]);

  // Auto-advance states based on patient data
  useEffect(() => {
    if (hasPatientData && chatState === 'idle') {
      setChatState('patient_data');
    } else if (!hasPatientData && chatState === 'patient_data') {
      setChatState('idle');
    }
  }, [hasPatientData, chatState]);

  /**
   * Send a message and get AI response
   */
  const handleSendMessage = useCallback(async (message: string) => {
    console.log('handleSendMessage called with:', message);
    console.log('Current state:', { hasPatientData, patientData, currentConversationId });
    
    if (!message.trim()) {
      console.log('Message is empty, returning');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChatState('analyzing');

    try {
      // Create user message first
      const userMessage: EnhancedChatMessage = {
        id: Date.now(), // Temporary ID
        user_message: message,
        ai_response: '',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Determine if this should be intelligent chat or analysis
      const needsAnalysis = hasPatientData && isAnalysisRequest(message);
      
      let response: RagChatAnalyzeResponse | IntelligentChatResponse;
      
      if (needsAnalysis) {
        // Use analysis endpoint for cephalometric analysis with patient data
        const analysisPayload = {
          message,
          conversation_id: currentConversationId,
          analysis_type: analysisType,
          include_meta_analysis: true,
          include_rag_search: true,
          patient_data: patientData || undefined,
        };
        console.log('Calling conversationApi.analyzeWithRag with payload:', analysisPayload);
        response = await conversationApi.analyzeWithRag(analysisPayload);
      } else {
        // Use intelligent chat for normal conversations
        const intelligentPayload = {
          message,
          conversation_id: currentConversationId,
          patient_data: hasPatientData ? patientData : null,
        };
        console.log('Calling conversationApi.intelligentChat with payload:', intelligentPayload);
        response = await conversationApi.intelligentChat(intelligentPayload);
      }
      
      console.log('Received response from API:', response);

      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }

      // Create AI response message
      const aiMessage: EnhancedChatMessage = {
        id: Date.now() + 1, // Temporary ID
        user_message: message,
        ai_response: response.response,
        created_at: new Date().toISOString(),
        meta_analysis_results: needsAnalysis ? (response as RagChatAnalyzeResponse).meta_analysis_results : undefined,
        literature_references: response.literature_references,
      };

      // Replace the user message with the complete message pair
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiMessage;
        return newMessages;
      });

      setChatState('chatting');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove the failed user message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, analysisType, hasPatientData, patientData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Start new conversation
   */
  const startNewConversation = useCallback(async () => {
    const newConversationId = await conversationApi.startNewConversation();
    setCurrentConversationId(newConversationId);
    setMessages([]);
    setChatState(hasPatientData ? 'patient_data' : 'idle');
  }, [hasPatientData]);

  /**
   * Auto-start analysis when patient data is loaded
   */
  useEffect(() => {
    console.log('Auto-analysis check:', {
      hasPatientData,
      hasTriggeredAutoAnalysis, 
      isLoading,
      chatState,
      patientData
    });
    
    // Only trigger once when patient data is loaded and we haven't triggered yet
    if (hasPatientData && !hasTriggeredAutoAnalysis && !isLoading) {
      console.log('Triggering auto-analysis...');
      setHasTriggeredAutoAnalysis(true);
      
      // Auto-start comprehensive analysis after patient data is loaded
      const autoStartMessage = "Please generate a comprehensive cephalometric analysis report for this patient, including meta-analysis comparison and clinical recommendations.";
      
      // Change state to chatting if needed
      if (chatState === 'idle' || chatState === 'patient_data') {
        setChatState('chatting');
      }
      
      // Call directly without setTimeout to avoid race conditions
      console.log('Sending auto-analysis message...', autoStartMessage);
      handleSendMessage(autoStartMessage).catch(err => {
        console.error('Auto-analysis message failed:', err);
      });
    }
  }, [hasPatientData, hasTriggeredAutoAnalysis, isLoading, chatState, handleSendMessage, patientData]);
  
  // Reset auto-trigger flag when patient data is cleared
  useEffect(() => {
    if (!hasPatientData) {
      setHasTriggeredAutoAnalysis(false);
    }
  }, [hasPatientData]);

  /**
   * Render current state UI
   */
  const renderCurrentState = () => {
    switch (chatState) {
      case 'idle':
      case 'patient_data':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Dental Cephalometric Analysis
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {hasPatientData 
                    ? "Patient data loaded. Ask me about the cephalometric analysis, OSA risk assessment, or orthodontic recommendations."
                    : "Upload patient cephalometric data or start a conversation to begin analysis."
                  }
                </p>
              </div>

              {hasPatientData && (
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Patient data ready</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'chatting':
      case 'analyzing':
        return (
          <div className="flex-1 flex flex-col min-h-0">
            <MessageList 
              messages={messages}
              isLoading={isLoading}
              className="flex-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Patient Data Section - Collapsible when chatting */}
      {(chatState === 'idle' || chatState === 'patient_data') && (
        <div className="border-b bg-gray-50 dark:bg-gray-900/20 p-4">
          <PatientDataUpload 
            patientData={patientData}
            isLoading={patientDataLoading}
            error={patientDataError}
            uploadProgress={uploadProgress}
            uploadExcelFile={uploadExcelFile}
            clearPatientData={clearPatientData}
            updatePatientData={updatePatientData}
            clearError={clearPatientDataError}
            hasData={hasPatientData}
            preview={preview}
          />
        </div>
      )}

      {/* Analysis Type Selection */}
      {hasPatientData && chatState !== 'idle' && (
        <div className="border-b p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Analysis Type:</span>
            <div className="flex space-x-2">
              {(['comprehensive', 'osa_risk', 'orthodontic'] as AnalysisType[]).map((type) => (
                <Button
                  key={type}
                  variant={analysisType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnalysisType(type)}
                  className="text-xs"
                >
                  {type === 'comprehensive' && 'Comprehensive'}
                  {type === 'osa_risk' && 'OSA Risk'}
                  {type === 'orthodontic' && 'Orthodontic'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      {renderCurrentState()}

      {/* Message Input */}
      <div className="border-t">
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!hasPatientData && chatState === 'idle'}
          placeholder={
            hasPatientData 
              ? "Ask about cephalometric analysis, OSA risk, or orthodontic recommendations..." 
              : "Upload patient data first or ask a general question..."
          }
        />
      </div>

      {/* Additional Analysis Results */}
      {chatState === 'chatting' && (
        <div className="border-t max-h-60 overflow-y-auto">
          {/* Meta Analysis Results */}
          {messages.length > 0 && messages[messages.length - 1].meta_analysis_results && (
            <MetaAnalysisResults 
              results={messages[messages.length - 1].meta_analysis_results} 
            />
          )}
          
          {/* Literature References */}
          {messages.length > 0 && messages[messages.length - 1].literature_references && (
            <LiteratureReferences 
              references={messages[messages.length - 1].literature_references} 
            />
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t p-2 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {currentConversationId && (
            <span>ID: {currentConversationId.slice(-8)}</span>
          )}
          <span>{messages.length} messages</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={startNewConversation}
          className="text-xs"
        >
          New Conversation
        </Button>
      </div>
    </div>
  );
}

export default ChatInterface;