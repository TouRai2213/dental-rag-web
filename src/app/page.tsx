'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Search, Plus, ArrowUp, Send, Bot, User, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/sidebar';
import { FormattedResponse } from '@/components/chat/formatted-response';
import { LiteratureSearchWithSidebar } from '@/components/literature/literature-search-with-sidebar';
import { LoginForm } from '@/components/auth/login-form';
import { conversationApi } from '@/lib/api/conversations';
import { localApiClient } from '@/lib/api/client';
import { usePatientData } from '@/hooks/use-patient-data';
import { useEnhancedConversations } from '@/hooks/use-enhanced-conversations';
import { useAddedSections } from '@/hooks/use-added-sections';
import { useAuth } from '@/providers/auth-provider';
import { DynamicDiagram } from '@/components/animation/dynamic-diagram';
import type { ChatMessage, LiteratureReference } from '@/types/conversation';

// Extend ChatMessage to include literature references
interface EnhancedChatMessage extends ChatMessage {
  literature_references?: LiteratureReference[];
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Image
              src="/dental-brain-logo.png"
              alt="Dental Brain"
              width={48}
              height={48}
              className="h-12 w-auto mx-auto mb-6"
            />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Access your dental analysis dashboard
            </p>
          </div>
          <div className="mt-8">
            <LoginForm callbackUrl="/" />
          </div>
        </div>
      </div>
    );
  }

  // Show main application if authenticated
  return <MainApplication />;
}

function MainApplication() {
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [message, setMessage] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Research mode state
  const [useResearch, setUseResearch] = useState(false);

  // Literature selection state
  const [selectedLiterature, setSelectedLiterature] = useState<Array<{
    title: string;
    authors: string[];
    pmid?: string;
    weight: number;
  }>>([]);
  
  // Patient data management
  const {
    patientData,
    isLoading: isPatientDataLoading,
    error: patientDataError,
    uploadProgress,
    uploadExcelFile,
    clearPatientData,
    hasData: hasPatientData
  } = usePatientData();
  
  // Enhanced conversations hook for sidebar functionality
  const {
    refreshConversations,
    loadConversation,
    filteredConversations,
    isLoading: conversationsLoading,
    searchQuery,
    setSearchQuery,
  } = useEnhancedConversations();

  // Watch for new session creation to refresh conversations
  const { getSectionsForSession } = useAddedSections();
  
  // Refresh conversations when a new literature session is created
  // Note: This functionality has been temporarily disabled
  
  // File input ref for triggering file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Messages container ref for auto-scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced auto-scroll functionality
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = maxScroll;
      
      // Double-check scroll position with delay
      setTimeout(() => {
        const isAtBottom = Math.abs(container.scrollTop + container.clientHeight - container.scrollHeight) < 10;
        if (!isAtBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }, 10);
    }
  }, []);

  const scrollToLatestMessage = useCallback((force = false) => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const messageItems = container.querySelectorAll('.message-item');
    const lastMessageItem = messageItems[messageItems.length - 1] as HTMLElement;
    
    if (!lastMessageItem) {
      scrollToBottom();
      return;
    }
    
    // Check if message is long (height > 400px indicates long content)
    const messageHeight = lastMessageItem.offsetHeight;
    const isLongMessage = messageHeight > 400;
    
    if (isLongMessage && !force) {
      // For long messages, scroll to the top of the message for better readability
      lastMessageItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // For normal messages, scroll to bottom
      scrollToBottom();
    }
  }, [scrollToBottom]);
  
  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    
    // Load conversation messages from the backend
    try {
      console.log('Loading conversation:', conversationId);
      await loadConversation(conversationId);
      
      // Fetch conversation messages from the backend API
      const response = await localApiClient.get(`/api/chat/messages/${conversationId}`) as any[];
      console.log('Loaded conversation messages:', response);

      // Debug: Check actual database structure
      if (response.length > 0) {
        console.log('🔍 FIRST MESSAGE STRUCTURE:', response[0]);
        console.log('🔍 response_data content:', response[0].response_data);
        if (response[0].response_data) {
          try {
            const parsed = JSON.parse(response[0].response_data);
            console.log('🔍 PARSED response_data:', parsed);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('🔍 FIRST LITERATURE REFERENCE:', parsed[0]);
            }
          } catch (e) {
            console.log('🔍 response_data is not JSON:', e);
          }
        }
      }
      
      // Transform messages to match our EnhancedChatMessage type
      const conversationMessages: EnhancedChatMessage[] = response.map((msg: any) => {
        // Parse literature references from response_data or literature_references (backward compatibility)
        let literatureRefs: LiteratureReference[] | undefined;

        const dataSource = msg.response_data || msg.literature_references;
        if (dataSource) {
          try {
            // If it's a string, parse it; if it's already an object, use it directly
            const parsedData = typeof dataSource === 'string'
              ? JSON.parse(dataSource)
              : dataSource;

            // Check if the parsed data is already in frontend format (has document_source field)
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].document_source) {
              literatureRefs = parsedData;
            } else if (Array.isArray(parsedData)) {
              // Convert from backend format to frontend format
              literatureRefs = parsedData.map((ref: any) => ({
                id: ref.id?.toString() || ref.doc_id?.toString() || 'unknown',
                doc_uid: ref.doc_uid || ref.document_id || `ref_${ref.id || ref.doc_id || 'unknown'}`,
                title: ref.title || ref.document_title || 'Untitled Reference',
                authors: ref.authors || ref.author || ref.first_author || 'Unknown Author',
                journal: ref.journal || ref.source || ref.publication || 'Unknown Source',
                year: ref.year ? parseInt(ref.year) : (ref.publication_year ? parseInt(ref.publication_year) : undefined),
                doi: ref.doi || undefined,
                pmid: ref.pmid || ref.pubmed_id || undefined,
                citations: ref.citations || undefined,
                relevance_score: ref.relevance_score || ref.score || undefined,
                match_type: ref.document_source || ref.source_type || ref.match_type || (ref.source?.toLowerCase().includes('pubmed') ? 'pubmed' : 'local'),
                document_source: ref.document_source || ref.source_type || (ref.source?.toLowerCase().includes('pubmed') ? 'pubmed' : 'local'),
                content_preview: ref.content_preview || ref.preview || undefined,
                excerpt: ref.excerpt || ref.summary || undefined,
              }));
            }

          } catch (error) {
            console.warn('Failed to parse literature references for message', msg.id, error);
            literatureRefs = undefined;
          }
        }
        
        const transformedMessage = {
          id: msg.id,
          user_message: msg.user_message,
          ai_response: msg.ai_response,
          created_at: msg.created_at,
          literature_references: literatureRefs,
        };
        
        
        return transformedMessage;
      });
      
      setMessages(conversationMessages);
      
      // Auto-scroll to bottom after loading conversation with multiple attempts
      setTimeout(() => {
        scrollToLatestMessage(true); // Force scroll to bottom for conversation loading
      }, 500);
      
      setTimeout(() => {
        scrollToLatestMessage(true);
      }, 1000);
      
      setTimeout(() => {
        scrollToLatestMessage(true);
      }, 2000);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [loadConversation, scrollToLatestMessage]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    // Show confirmation dialog
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    
    try {
      console.log('Deleting conversation:', conversationId);
      
      // Call the delete API
      await conversationApi.deleteConversation(conversationId);
      
      // If the deleted conversation was currently selected, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId('');
        setMessages([]);
      }
      
      // Refresh the conversations list
      await refreshConversations();
      
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to delete conversation. Please try again.');
    }
  }, [conversationApi, currentConversationId, refreshConversations]);

  // Convert backend literature references format to frontend format
  // This now handles both IntelligentChatResponse and RagChatAnalyzeResponse with unified evidence_data structure
  const convertLiteratureReferences = useCallback((response: any): LiteratureReference[] | undefined => {
    // First try the evidence_data field (unified structure for both endpoints)
    if (response.evidence_data?.literature_references) {
      return response.evidence_data.literature_references.map((ref: any) => ({
        id: ref.id?.toString() || ref.doc_id?.toString() || 'unknown',
        doc_uid: ref.doc_uid || ref.document_id || `ref_${ref.id || ref.doc_id || 'unknown'}`,
        title: ref.title || ref.document_title || 'Untitled Reference',
        authors: ref.authors || ref.author || ref.first_author || 'Unknown Author',
        journal: ref.journal || ref.source || ref.publication || 'Unknown Source',
        year: ref.year ? parseInt(ref.year) : (ref.publication_year ? parseInt(ref.publication_year) : undefined),
        doi: ref.doi || undefined,
        pmid: ref.pmid || ref.pubmed_id || undefined,
        citations: ref.citations || undefined,
        relevance_score: ref.relevance_score || ref.score || undefined,
        match_type: ref.document_source || ref.source_type || ref.match_type || (ref.source?.toLowerCase().includes('pubmed') ? 'pubmed' : 'local'),
        document_source: ref.document_source || ref.source_type || (ref.source?.toLowerCase().includes('pubmed') ? 'pubmed' : 'local'),
        content_preview: ref.content_preview || ref.preview || undefined,
        excerpt: ref.excerpt || ref.summary || undefined,
      }));
    }
    
    // Fallback to legacy field for backward compatibility
    return response.literature_references;
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    // Add user message to display
    const tempUserMsg: EnhancedChatMessage = {
      id: Date.now(),
      user_message: userMessage,
      ai_response: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    
    // Auto-scroll to bottom after adding user message
    setTimeout(() => {
      scrollToBottom(); // User messages are always short, so scroll to bottom
    }, 50);

    try {
      // Get added literature for current session
      const addedLiterature = currentConversationId 
        ? getSectionsForSession(currentConversationId).map(section => section.reference)
        : [];


      // Prepare recent history (last 5-10 messages) for context
      const recentHistory = messages.slice(-10).map(msg => [
        { role: 'user' as const, content: msg.user_message, timestamp: msg.created_at },
        { role: 'assistant' as const, content: msg.ai_response, timestamp: msg.created_at }
      ]).flat().filter(item => item.content); // Flatten and filter out empty content

      // Call the intelligent chat API with Research mode support
      const response = await conversationApi.intelligentChat({
        message: userMessage,
        conversation_id: currentConversationId,
        session_id: currentConversationId,
        added_literature: addedLiterature.length > 0 ? addedLiterature : undefined,
        use_research: useResearch, // Enable Research mode RAG Pipeline
        recent_history: recentHistory, // Send recent context to backend
      });

      // Update conversation ID if new
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
      }


      // Update with AI response
      const convertedRefs = convertLiteratureReferences(response);

      const aiMessage: EnhancedChatMessage = {
        id: Date.now() + 1,
        user_message: userMessage,
        ai_response: response.response,
        created_at: new Date().toISOString(),
        literature_references: convertedRefs,
      };
      
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiMessage;
        return newMessages;
      });

      // Auto-scroll intelligently after AI response (may scroll to message top if long)
      setTimeout(() => {
        scrollToLatestMessage();
      }, 100);

      // Save conversation to local database for sidebar
      console.log('About to save conversation to local database...');
      try {
        const savePayload = {
          session_id: response.conversation_id,
          user_message: userMessage,
          ai_response: response.response,
          patient_data: hasPatientData ? patientData : null,
          response_data: convertedRefs ? JSON.stringify(convertedRefs) : null,
        };
        
        const saveResult = await localApiClient.post('/api/conversations', savePayload);
        console.log('Conversation saved to local database successfully:', saveResult);
        
        // Refresh sidebar conversations list in real-time
        try {
          await refreshConversations();
          console.log('Sidebar conversations refreshed successfully');
        } catch (refreshError) {
          console.error('Failed to refresh sidebar conversations:', refreshError);
        }
      } catch (saveError) {
        console.error('Failed to save conversation to local database:', saveError);
        // Don't fail the entire operation if saving fails
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the failed message
      setMessages(prev => prev.slice(0, -1));
      setMessage(userMessage); // Restore the message
    } finally {
      setIsLoading(false);
    }
  }, [message, currentConversationId, isLoading, hasPatientData, patientData, refreshConversations]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  

  const handleNewConversation = () => {
    // Clear current conversation
    setCurrentConversationId(undefined);
    setMessages([]);
    setMessage('');
    setIsLoading(false);
    // Also clear patient data when starting new conversation
    clearPatientData();
    // Clear selected literature
    setSelectedLiterature([]);
  };

  // Handle literature selection for session weighting
  const handleAddLiteratureToSession = useCallback((literature: any, weight: number) => {
    const newItem = {
      title: literature.title,
      authors: literature.authors || [],
      pmid: literature.pmid,
      weight
    };
    
    setSelectedLiterature(prev => {
      // Check if already exists
      const existingIndex = prev.findIndex(item => 
        item.title === newItem.title || (item.pmid && item.pmid === newItem.pmid)
      );
      
      if (existingIndex >= 0) {
        // Update existing weight
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], weight };
        return updated;
      } else {
        // Add new literature
        return [...prev, newItem];
      }
    });
    
  }, []);
  
  const handleFileUpload = () => {
    console.log('Upload button clicked');
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type);

    try {
      console.log('Starting file upload...');
      await uploadExcelFile(file);
      console.log('File upload completed');
      // Report generation is handled by the useEffect that watches hasPatientData
    } catch (error) {
      console.error('Failed to upload file:', error);
    }

    // Clear the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const generateAutomaticReport = useCallback(async () => {
    if (!hasPatientData || !patientData) return;
    
    setIsLoading(true);

    // The actual message that should be sent to analyze endpoint
    const analysisMessage = '包括的な頭影測定分析レポートを生成してください';
    
    // Create a message showing what we're requesting
    const reportRequestMessage: EnhancedChatMessage = {
      id: Date.now(),
      user_message: analysisMessage, // Use the actual analysis request message
      ai_response: '',
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, reportRequestMessage]);
    
    try {
      // Get added literature for current session
      const addedLiterature = currentConversationId 
        ? getSectionsForSession(currentConversationId).map(section => section.reference)
        : [];

      // Call the analyze endpoint specifically for patient data analysis

      const response = await conversationApi.analyzeWithRag({
        message: analysisMessage,
        conversation_id: currentConversationId,
        patient_data: patientData,
        analysis_type: 'comprehensive',
        include_meta_analysis: true,
        include_rag_search: true,
        session_id: currentConversationId,
        added_literature: addedLiterature.length > 0 ? addedLiterature : undefined,
      });
      
      // Update conversation ID if new
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
      }
      
      // Update with AI response
      const aiMessage: EnhancedChatMessage = {
        id: Date.now() + 1,
        user_message: analysisMessage, // Ensure we use the correct analysis message
        ai_response: response.response,
        created_at: new Date().toISOString(),
        literature_references: convertLiteratureReferences(response),
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiMessage;
        return newMessages;
      });

      // Auto-scroll intelligently after AI response (may scroll to message top if long)
      setTimeout(() => {
        scrollToLatestMessage();
      }, 100);

      // Save conversation to local database for sidebar
      console.log('Saving patient analysis report to local database...');
      try {
        const literatureRefs = convertLiteratureReferences(response);
        const savePayload = {
          session_id: response.conversation_id || currentConversationId,
          user_message: analysisMessage,
          ai_response: response.response,
          patient_data: patientData,
          response_data: literatureRefs ? JSON.stringify(literatureRefs) : null,
        };
        const saveResult = await localApiClient.post('/api/conversations', savePayload);
        
        // Refresh sidebar conversations list in real-time
        try {
          await refreshConversations();
          console.log('Sidebar conversations refreshed after patient analysis');
        } catch (refreshError) {
          console.error('Failed to refresh conversations:', refreshError);
        }
      } catch (saveError) {
        console.error('Failed to save patient analysis to local database:', saveError);
        // Don't throw - let the report display even if save fails
      }
    } catch (error) {
      console.error('Failed to generate automatic report:', error);
      // Remove the failed message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [hasPatientData, patientData, currentConversationId, refreshConversations, localApiClient, conversationApi, convertLiteratureReferences, getSectionsForSession]);

  // Auto-generate report when patient data is uploaded
  // Add a ref to track if report has been generated for current patient data
  const reportGeneratedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasPatientData && patientData && !isPatientDataLoading && !reportGeneratedRef.current) {
      reportGeneratedRef.current = true;
      generateAutomaticReport();
    }

    // Reset the flag when patient data is cleared
    if (!hasPatientData) {
      reportGeneratedRef.current = false;
    }
  }, [hasPatientData, patientData, isPatientDataLoading, generateAutomaticReport]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Fixed Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <img 
            src="/dental-brain-logo.png" 
            alt="Dental Brain" 
            className="h-8 w-auto"
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2" 
          onClick={handleNewConversation}
          title="Start new conversation"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Layout - with top padding to account for fixed header */}
      <div className="flex-1 flex relative pt-20 h-full min-h-0">
        {/* Fixed Left Sidebar */}
        {!isSidebarCollapsed && (
          <div className="fixed left-0 top-20 bottom-0 w-80 z-40 h-[calc(100vh-5rem)]">
            <Sidebar 
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              currentConversationId={currentConversationId}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
              conversations={filteredConversations}
              isLoading={conversationsLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
        )}
        
        {/* Collapsed sidebar button */}
        {isSidebarCollapsed && (
          <Sidebar 
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            currentConversationId={currentConversationId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            conversations={filteredConversations}
            isLoading={conversationsLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* Main Content Area - with left margin for sidebar */}
        <div className={`flex-1 flex flex-col relative ${!isSidebarCollapsed ? 'ml-80' : ''} h-full`}>
          {/* Main Chat Display Area */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 flex flex-col h-full min-h-0">
          {/* Show dynamic diagram centered when no messages */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center" style={{ paddingBottom: '200px' }}>
              <div className="w-full p-6">
                <div className="max-w-4xl mx-auto">
                  <img
                    src="/diagram.svg"
                    alt="Dental Brain System Architecture"
                    className="w-full h-auto"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show in initial state */}
          {messages.length === 0 && (
            <div className="flex justify-center space-x-4 py-6 bg-gray-200 dark:bg-gray-700">
              <button
                onClick={handleFileUpload}
                disabled={isPatientDataLoading}
                className="
                  relative flex items-center justify-center
                  w-[200px] h-[50px]
                  bg-white border border-black
                  border-t border-l border-r-4 border-b-4
                  rounded-lg
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  group
                  px-3
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Upload className="w-4 h-4 text-black mr-2 flex-shrink-0" />
                <span className="text-[14px] font-normal text-black font-roboto">
                  {isPatientDataLoading ? `アップロード中... ${uploadProgress}%` : '患者セファロデータをアップロード'}
                </span>
              </button>
              <LiteratureSearchWithSidebar sessionId={currentConversationId} />
            </div>
          )}

          {/* Messages Area - only show when messages exist */}
          {messages.length > 0 && (
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 min-h-0 max-h-full">
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Show messages when conversation started */}
              {messages.length > 0 && messages.map((msg) => (
                <div key={msg.id} className="message-item space-y-4">
                  {/* User Message */}
                  {msg.user_message && (
                    <div className="flex justify-end">
                      <div className="max-w-xs">
                        <div className="flex items-start space-x-2">
                          <div className="bg-gray-500 bg-opacity-50 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2">
                            {msg.user_message}
                          </div>
                          <User className="w-6 h-6 text-gray-600 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* AI Response */}
                  {msg.ai_response && (
                    <div className="flex justify-start">
                      <div className="w-full">
                        <div className="flex items-start space-x-2">
                          <Bot className="w-6 h-6 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 px-4 py-2">
                            <FormattedResponse 
                              content={msg.ai_response} 
                              literatureReferences={msg.literature_references}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-6 h-6 text-gray-600" />
                      <div className="px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Bottom Message Input - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 p-6 pb-8">
            <div className="max-w-4xl mx-auto">
              {/* Research Mode Status - Fixed height container to prevent layout shift */}
              <div className="h-8 flex items-center justify-center mb-3">
                {useResearch && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    <BookOpen className="w-3 h-3" />
                    <span>Research Mode Active - Will search literature before answering</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="質問してみましょう"
                  className="w-full pr-12 py-3 text-lg rounded-full border-gray-300 dark:border-gray-600"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2 h-8 w-8"
                >
                  <div
                    className="w-4 h-4"
                    style={{
                      maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23000' d='M8.864 2.157a.5.5 0 0 0-.728 0l-4 4.25a.5.5 0 0 0 .728.686L8 3.76V15a3 3 0 0 0 3 3h4.5a.5.5 0 0 0 0-1H11a2 2 0 0 1-2-2V3.76l3.136 3.333a.5.5 0 0 0 .728-.686z'/%3E%3C/svg%3E\")",
                      WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23000' d='M8.864 2.157a.5.5 0 0 0-.728 0l-4 4.25a.5.5 0 0 0 .728.686L8 3.76V15a3 3 0 0 0 3 3h4.5a.5.5 0 0 0 0-1H11a2 2 0 0 1-2-2V3.76l3.136 3.333a.5.5 0 0 0 .728-.686z'/%3E%3C/svg%3E\")",
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskSize: '100% 100%',
                      WebkitMaskSize: '100% 100%',
                      backgroundColor: 'currentColor',
                      transform: 'scaleX(-1)'
                    }}
                  />
                </Button>
              </div>

              {/* Small icon buttons - Always show (both homepage and conversation) */}
              <div className="flex items-center justify-start space-x-3 mt-3 ml-2 mb-4">
                <button
                  onClick={() => setUseResearch(!useResearch)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full shadow hover:shadow-md transition-all duration-200 ${
                    useResearch
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                  title={`${useResearch ? 'Disable' : 'Enable'} Research Mode - Search literature before answering`}
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isPatientDataLoading}
                  className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  title="患者セファロデータをアップロード"
                >
                  <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => {
                    const trigger = document.getElementById('literature-search-trigger');
                    if (trigger) trigger.click();
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow hover:shadow-md transition-all duration-200"
                  title="歯科文献を検索"
                >
                  <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
        
      {/* Literature Search Dialog */}
        <LiteratureSearchWithSidebar 
          sessionId={currentConversationId}
          trigger={
            <div 
              style={{ display: 'none' }}
              id="literature-search-trigger"
            />
          }
          onViewDetail={(reference) => {
          }}
        />
    </div>
  );
}
