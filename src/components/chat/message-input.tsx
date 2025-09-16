/**
 * Message Input Component
 * Chat input with send functionality and optional Excel upload integration
 * Supports multi-line input, keyboard shortcuts, and file attachment
 */

'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, FileSpreadsheet, Paperclip, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';

interface MessageInputProps {
  onSendMessage: (message: string, useResearch?: boolean) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showFileUpload?: boolean;
  className?: string;
  // Research mode props
  useResearch?: boolean;
  onResearchToggle?: (enabled: boolean) => void;
  showResearchToggle?: boolean;
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Type your message here...",
  maxLength = 2000,
  showFileUpload = false,
  className = '',
  // Research mode props
  useResearch = false,
  onResearchToggle,
  showResearchToggle = true
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px height
    textarea.style.height = `${newHeight}px`;
    
    setIsExpanded(newHeight > 40); // Expand if multi-line
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      adjustTextareaHeight();
    }
  }, [maxLength, adjustTextareaHeight]);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    try {
      await onSendMessage(trimmedMessage, useResearch);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        setIsExpanded(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, onSendMessage, isLoading, disabled, useResearch]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter for new line - let default behavior handle it
        return;
      } else {
        // Enter to send
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend]);

  // Handle file upload (if enabled)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // For now, just add file name to message
      const fileMessage = `[Uploaded file: ${file.name}]\n${message}`;
      setMessage(fileMessage);
      // Clear file input
      e.target.value = '';
    }
  }, [message]);

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className={`p-4 ${className}`} ref={(el) => {
      if (el) {
        console.log('🔍 MESSAGE INPUT DEBUG - Container dimensions:', {
          height: el.clientHeight,
          scrollHeight: el.scrollHeight,
          offsetHeight: el.offsetHeight,
          boundingRect: el.getBoundingClientRect()
        });
      }
    }}>
      {/* Research Mode Status - Fixed height container to prevent layout shift */}
      <div className="h-8 flex items-center justify-center mb-3">
        {useResearch && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
            <BookOpen className="w-3 h-3" />
            <span>Research Mode Active - Will search literature before answering</span>
          </div>
        )}
      </div>

      <Card className={`relative ${isExpanded ? 'p-4' : 'p-3'} transition-all duration-200`}>
        <div className="flex items-end space-x-3">
          {/* File Upload Button (Optional) */}
          {showFileUpload && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className="h-8 w-8 p-0"
                title="Upload file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Please upload patient data first..." : placeholder}
              disabled={disabled || isLoading}
              className="w-full resize-none border-0 outline-none bg-transparent text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{ 
                minHeight: '24px',
                maxHeight: '120px'
              }}
              rows={1}
            />
            
            {/* Character counter (when near limit) */}
            {isNearLimit && (
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${remainingChars < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                  {remainingChars} characters remaining
                </span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled || isLoading}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isLoading ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded info bar */}
        {isExpanded && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Shift + Enter for new line</span>
              <span>•</span>
              <span>Enter to send</span>
            </div>
            <div className="flex items-center space-x-2">
              {message.trim() && (
                <Badge variant="outline" className="text-xs">
                  {message.split('\n').length} lines
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions (when not expanded) - Fixed position with min height */}
      {!isExpanded && !disabled && (
        <div className="flex items-center justify-between mt-2 px-1 min-h-20 py-4">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span>Enter to send • Shift+Enter for new line</span>
            {useResearch && (
              <Badge variant="secondary" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                Research Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {showResearchToggle && onResearchToggle && (
              <Button
                variant={useResearch ? "default" : "ghost"}
                size="sm"
                onClick={() => onResearchToggle(!useResearch)}
                className={`h-6 text-xs px-2 ${
                  useResearch
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'hover:bg-blue-50 hover:text-blue-600'
                }`}
                title={`${useResearch ? 'Disable' : 'Enable'} Research Mode - Search literature before answering`}
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Research
              </Button>
            )}
            {showFileUpload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 text-xs px-2"
              >
                <FileSpreadsheet className="w-3 h-3 mr-1" />
                Excel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Additional spacing to ensure buttons are always visible */}
      <div className="h-32"></div>
    </div>
  );
}

export default MessageInput;