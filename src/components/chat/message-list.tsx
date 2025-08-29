/**
 * Message List Component
 * Displays chat messages with user/AI distinction and formatting
 * Supports markdown rendering for AI responses
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { User, Bot, FileSpreadsheet, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import type { ChatMessage, LiteratureReference } from '@/types/conversation';

interface EnhancedChatMessage extends ChatMessage {
  meta_analysis_results?: any[];
  literature_references?: LiteratureReference[];
}

interface MessageListProps {
  messages: EnhancedChatMessage[];
  isLoading?: boolean;
  className?: string;
}

interface MessageItemProps {
  message: EnhancedChatMessage;
}

/**
 * Individual message component
 */
function MessageItem({ message }: MessageItemProps) {
  const [copiedUser, setCopiedUser] = React.useState(false);
  const [copiedAI, setCopiedAI] = React.useState(false);

  const copyToClipboard = async (text: string, type: 'user' | 'ai') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'user') {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 2000);
      } else {
        setCopiedAI(true);
        setTimeout(() => setCopiedAI(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-2">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 bg-blue-100 dark:bg-blue-900">
                <User className="w-5 h-5 text-blue-700" />
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs mb-2">
                    You
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.user_message, 'user')}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    {copiedUser ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.user_message}
                </p>
                <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(message.created_at)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Response */}
      {message.ai_response && (
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Card className="p-4 group">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 bg-green-100 dark:bg-green-900">
                  <Bot className="w-5 h-5 text-green-700" />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs mb-2 bg-green-100 text-green-800">
                      AI Assistant
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.ai_response, 'ai')}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      {copiedAI ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  {/* AI Response Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap break-words text-sm">
                      {message.ai_response}
                    </div>
                  </div>

                  {/* Analysis Indicators */}
                  <div className="flex items-center space-x-3 mt-3">
                    {message.meta_analysis_results && message.meta_analysis_results.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        {message.meta_analysis_results.length} Meta Results
                      </Badge>
                    )}
                    {message.literature_references && message.literature_references.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                        {message.literature_references.length} References
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(message.created_at)}</span>
                    {message.model_used && (
                      <>
                        <span>•</span>
                        <span>{message.model_used}</span>
                      </>
                    )}
                    {message.input_tokens && message.output_tokens && (
                      <>
                        <span>•</span>
                        <span>{message.input_tokens + message.output_tokens} tokens</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Typing indicator component
 */
function TypingIndicator() {
  return (
    <div className="flex justify-start py-4">
      <div className="max-w-[80%]">
        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8 bg-green-100 dark:bg-green-900">
              <Bot className="w-5 h-5 text-green-700" />
            </Avatar>
            <div className="flex-1">
              <Badge variant="secondary" className="text-xs mb-2 bg-green-100 text-green-800">
                AI Assistant
              </Badge>
              <div className="flex items-center space-x-2">
                <LoadingSpinner className="w-4 h-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Analyzing cephalometric data...
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <Bot className="w-12 h-12 text-gray-400 mx-auto" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No messages yet
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Start a conversation by asking about cephalometric analysis, 
          OSA risk assessment, or orthodontic recommendations.
        </p>
      </div>
    </div>
  );
}

/**
 * Main message list component
 */
export function MessageList({ messages, isLoading = false, className = '' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={`flex flex-col ${className}`}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 space-y-1"
      >
        {messages.map((message, index) => (
          <MessageItem 
            key={message.id || index} 
            message={message} 
          />
        ))}
        
        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageList;