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
import { localApiClient } from '@/lib/api/client';
import { usePatientData } from '@/hooks/use-patient-data';
import type { 
  ChatMessage,
  RagChatAnalyzeRequest,
  RagChatAnalyzeResponse,
  IntelligentChatResponse,
  AnalysisType,
  LiteratureReference
} from '@/types/conversation';


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

  // Research mode state
  const [useResearch, setUseResearch] = useState(false);

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

  // Auto-start analysis when patient data is loaded
  const [hasTriggeredAutoAnalysis, setHasTriggeredAutoAnalysis] = useState(false);


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
  const handleSendMessage = useCallback(async (message: string, useResearchMode?: boolean) => {
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

      // Always use intelligent chat for text input - let GPT-5 decide what tools to use
      const intelligentPayload = {
        message,
        conversation_id: currentConversationId,
        patient_data: hasPatientData ? patientData : null,
        use_research: useResearchMode ?? useResearch, // Use the passed parameter or default state
      };
      console.log('Calling conversationApi.intelligentChat with payload:', intelligentPayload);
      const response = await conversationApi.intelligentChat(intelligentPayload);
      
      console.log('Received response from API:', response);
      console.log('Response conversation_id:', response.conversation_id);

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
        meta_analysis_results: (response as any).meta_analysis_results, // May exist if GPT-5 used generate_report tool
        literature_references: response.literature_references,
      };

      // Replace the user message with the complete message pair
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiMessage;
        return newMessages;
      });

      // Save conversation to local database for sidebar
      console.log('About to save conversation to local database...');
      try {
        const savePayload = {
          session_id: response.conversation_id,
          user_message: message,
          ai_response: response.response,
          patient_data: hasPatientData ? patientData : null,
          response_data: JSON.stringify({
            literature_references: response.literature_references,
            meta_analysis_results: response.meta_analysis_results,
            evidence_data: response.evidence_data,
            citations: response.citations
          }),
        };
        console.log('Save payload:', savePayload);
        
        const saveResult = await localApiClient.post('/api/conversations', savePayload);
        console.log('Conversation saved to local database successfully:', saveResult);
      } catch (saveError) {
        console.error('Failed to save conversation to local database:', saveError);
        // Don't fail the entire operation if saving fails
      }

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
   * Generate comprehensive analysis report using analyze endpoint
   */
  const handleGenerateReport = useCallback(async () => {
    if (!hasPatientData || !patientData) {
      console.log('No patient data available for report generation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setChatState('analyzing');

    try {
      // Create user message for UI
      const reportRequestMessage: EnhancedChatMessage = {
        id: Date.now(),
        user_message: "患者データの包括的な頭影測定分析レポートを生成中...",
        ai_response: '',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, reportRequestMessage]);

      // Call analyze endpoint for comprehensive report
      const analyzePayload: RagChatAnalyzeRequest = {
        message: "包括的な頭影測定分析レポートを生成してください",
        conversation_id: currentConversationId,
        patient_data: patientData,
        analysis_type: 'comprehensive' as AnalysisType,
        include_meta_analysis: true,
        include_rag_search: true,
      };
      
      console.log('Calling conversationApi.analyzeWithRag with payload:', analyzePayload);
      const response = await conversationApi.analyzeWithRag(analyzePayload);
      
      console.log('Received analysis response from API:', response);

      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }

      // Create response message with analysis results
      const analysisMessage: EnhancedChatMessage = {
        id: Date.now() + 1,
        user_message: "患者データの包括的な頭影測定分析レポートを生成",
        ai_response: response.response,
        created_at: new Date().toISOString(),
        meta_analysis_results: response.meta_analysis_results,
        literature_references: response.literature_references,
      };

      // Replace the loading message with the complete analysis
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = analysisMessage;
        return newMessages;
      });

      // Save conversation to local database for sidebar
      try {
        const savePayload = {
          session_id: response.conversation_id,
          user_message: "包括的な頭影測定分析レポートを生成してください",
          ai_response: response.response,
          patient_data: patientData,
          response_data: JSON.stringify({
            literature_references: response.literature_references,
            meta_analysis_results: response.meta_analysis_results,
            evidence_data: response.evidence_data,
            citations: response.citations
          }),
        };

        const saveResult = await localApiClient.post('/api/conversations', savePayload);
        console.log('Analysis report saved to local database successfully:', saveResult);
      } catch (saveError) {
        console.error('Failed to save analysis report to local database:', saveError);
      }

      setChatState('chatting');
    } catch (err) {
      console.error('Failed to generate analysis report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate analysis report');
      
      // Remove the failed message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId]);

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
      
      // Change state to chatting if needed
      if (chatState === 'idle' || chatState === 'patient_data') {
        setChatState('chatting');
      }
      
      // Use analyze endpoint for patient data report generation
      console.log('Generating comprehensive analysis report...');
      handleGenerateReport().catch(err => {
        console.error('Auto-analysis report generation failed:', err);
      });
    }
  }, [hasPatientData, hasTriggeredAutoAnalysis, isLoading, chatState]);
  
  // Reset auto-trigger flag when patient data is cleared
  useEffect(() => {
    if (!hasPatientData) {
      setHasTriggeredAutoAnalysis(false);
    }
  }, [hasPatientData]);

  /**
   * Check if conversation has started (has any messages)
   */
  const hasStartedConversation = messages.length > 0;

  /**
   * Render current state UI
   */
  const renderCurrentState = () => {
    // If no messages exist, show welcome/initial state (like ChatGPT)
    if (!hasStartedConversation) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8" style={{paddingBottom: '200px'}}>
          {/* Animated demo area */}
          <div className="w-full max-w-4xl mb-8 flex justify-center">
            <iframe
              src="/animation.html"
              className="w-full max-w-3xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              style={{height: '250px'}}
              title="Dental RAG System Demo"
              frameBorder="0"
            />
          </div>

          {/* Action buttons matching design */}
          <div className="flex items-center gap-6 mb-8">
            <Button 
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base h-auto rounded-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                // Trigger patient data upload
                (document.querySelector('input[type="file"]') as HTMLInputElement)?.click();
              }}
            >
              📄 患者セファロデータをアップロード
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base h-auto rounded-lg border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                // Trigger literature search - could open a modal or redirect
                console.log('Literature search clicked');
              }}
            >
              📚 歯科文献を検索
            </Button>
          </div>

          {hasPatientData && (
            <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Patient data ready</span>
            </div>
          )}
        </div>
      );
    }

    // If messages exist, show conversation view (like ChatGPT chat mode)
    return (
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          className=""
        />
      </div>
    );

  };

  // Debug logging for layout
  useEffect(() => {
    console.log('🔍 CHAT INTERFACE DEBUG - Layout state:', {
      hasMessages: messages.length > 0,
      hasStartedConversation,
      chatState,
      className
    });
  }, [messages.length, hasStartedConversation, chatState, className]);

  return (
    <div className={`flex flex-col h-screen ${className}`} ref={(el) => {
      if (el) {
        console.log('🔍 CHAT INTERFACE DEBUG - Container dimensions:', {
          height: el.clientHeight,
          scrollHeight: el.scrollHeight,
          offsetHeight: el.offsetHeight
        });
      }
    }}>
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

      {/* Hidden Patient Data Upload - Integrated into main UI buttons */}
      <div className="hidden">
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

      {/* Analysis Type Selection - Hidden in new design */}

      {/* Main Chat Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden" ref={(el) => {
        if (el) {
          console.log('🔍 CHAT INTERFACE DEBUG - Chat area dimensions:', {
            height: el.clientHeight,
            scrollHeight: el.scrollHeight,
            offsetHeight: el.offsetHeight
          });
        }
      }}>
        {renderCurrentState()}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white dark:bg-gray-900" ref={(el) => {
        if (el) {
          console.log('🔍 CHAT INTERFACE DEBUG - Input area dimensions:', {
            height: el.clientHeight,
            scrollHeight: el.scrollHeight,
            offsetHeight: el.offsetHeight
          });
        }
      }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={false}
          placeholder="質問してみましょう"
          useResearch={useResearch}
          onResearchToggle={setUseResearch}
          showResearchToggle={true}
        />
      </div>


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