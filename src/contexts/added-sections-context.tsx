'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LiteratureReference } from '@/types/conversation';
import { localApiClient } from '@/lib/api/client';

export interface AddedSection {
  id: string;
  reference: LiteratureReference;
  addedAt: Date;
  sessionId: string;
}

interface AddedSectionsContextType {
  addedSections: AddedSection[];
  addSection: (reference: LiteratureReference, sessionId?: string) => Promise<string>;
  removeSection: (id: string) => void;
  clearSections: (sessionId?: string) => void;
  getSectionsForSession: (sessionId: string) => AddedSection[];
  isSectionAdded: (referenceId: string, sessionId?: string) => boolean;
  lastCreatedSessionId: string | null;
}

const AddedSectionsContext = createContext<AddedSectionsContextType | null>(null);

/**
 * Generate conversation title from literature title
 */
function generateConversationTitle(title: string): string {
  let cleanTitle = title.replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ').trim();
  
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanTitle)) {
    // Extract key concepts for Japanese titles
    const parts = cleanTitle.split(/[。、・\s-]+/).filter(part => part.length > 2);
    cleanTitle = parts.slice(0, 3).join(' ');
  } else {
    // For English titles, take meaningful words
    const words = cleanTitle.split(/\s+/).filter(word => 
      word.length > 3 && !/^(and|the|for|with|in|on|at|to|of|a|an)$/i.test(word)
    );
    cleanTitle = words.slice(0, 5).join(' ');
  }
  
  // Truncate to 50 characters max
  if (cleanTitle.length > 50) {
    cleanTitle = cleanTitle.substring(0, 47) + '...';
  }
  
  return cleanTitle || 'Literature Session';
}

interface AddedSectionsProviderProps {
  children: ReactNode;
}

export function AddedSectionsProvider({ children }: AddedSectionsProviderProps) {
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [lastCreatedSessionId, setLastCreatedSessionId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dental-rag-added-sections');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sectionsWithDates = parsed.map((section: any) => ({
          ...section,
          addedAt: new Date(section.addedAt)
        }));
        console.log('AddedSectionsContext - Loading from localStorage:', sectionsWithDates.length);
        setAddedSections(sectionsWithDates);
      }
    } catch (error) {
      console.warn('Failed to load added sections from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever sections change
  useEffect(() => {
    try {
      console.log('AddedSectionsContext - Saving to localStorage:', {
        sectionsCount: addedSections.length,
        sections: addedSections
      });
      localStorage.setItem('dental-rag-added-sections', JSON.stringify(addedSections));
      
      // Verify save
      const saved = localStorage.getItem('dental-rag-added-sections');
      console.log('AddedSectionsContext - Verification after save:', {
        savedData: saved,
        parsedLength: saved ? JSON.parse(saved).length : 0
      });
    } catch (error) {
      console.warn('Failed to save added sections to localStorage:', error);
    }
  }, [addedSections]);


  /**
   * Add a literature reference as a section
   */
  const addSection = useCallback(async (reference: LiteratureReference, sessionId?: string): Promise<string> => {
    // Use provided sessionId or create a default one
    let effectiveSessionId = sessionId || 'default-session';
    
    // Check if this is the first section being added to this session
    const existingSections = addedSections.filter(section => 
      section.sessionId === effectiveSessionId
    );
    
    const isFirstSection = existingSections.length === 0;
    
    // If this is the first section and we're using default session, create a new one
    if (isFirstSection && effectiveSessionId === 'default-session') {
      try {
        // Generate a new session ID
        effectiveSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a conversation title from the literature title
        const conversationTitle = generateConversationTitle(reference.title);
        
        // Create a new conversation in the database
        await localApiClient.post('/api/conversations', {
          user_message: `文献検索: ${conversationTitle}`,
          ai_response: '', // Empty response for literature session initialization
          session_id: effectiveSessionId,
          model_used: 'literature-session',
        });
        
        console.log(`Created new literature session: ${effectiveSessionId} - "${conversationTitle}"`);
        
        // Update the last created session ID to notify parent components
        setLastCreatedSessionId(effectiveSessionId);
      } catch (error) {
        console.warn('Failed to create conversation:', error);
        // Continue with default session if API fails
        effectiveSessionId = 'default-session';
      }
    }

    const newSection: AddedSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reference,
      addedAt: new Date(),
      sessionId: effectiveSessionId
    };

    setAddedSections(prev => {
      console.log('AddedSectionsContext - Before adding:', {
        previousCount: prev.length,
        newSection: newSection,
        reference: reference,
        effectiveSessionId: effectiveSessionId
      });
      
      // Check if already added (by title + authors to avoid duplicates)
      const exists = prev.some(section => 
        section.reference.title === reference.title && 
        section.reference.authors === reference.authors &&
        section.sessionId === effectiveSessionId
      );
      
      console.log('AddedSectionsContext - Exists check:', {
        exists: exists,
        title: reference.title,
        authors: reference.authors,
        sessionId: effectiveSessionId
      });
      
      if (exists) {
        console.log('AddedSectionsContext - Section already exists, not adding');
        return prev; // Don't add duplicates
      }
      
      const newSections = [...prev, newSection];
      console.log('AddedSectionsContext - After adding:', {
        newCount: newSections.length,
        allSections: newSections
      });
      
      return newSections;
    });
    
    return effectiveSessionId;
  }, [addedSections]);

  /**
   * Remove a section by ID
   */
  const removeSection = useCallback((id: string) => {
    setAddedSections(prev => prev.filter(section => section.id !== id));
  }, []);

  /**
   * Clear all sections, optionally for a specific session
   */
  const clearSections = useCallback((sessionId?: string) => {
    if (sessionId) {
      setAddedSections(prev => prev.filter(section => section.sessionId !== sessionId));
    } else {
      setAddedSections([]);
    }
  }, []);

  /**
   * Get sections for a specific session
   */
  const getSectionsForSession = useCallback((sessionId: string) => {
    return addedSections.filter(section => section.sessionId === sessionId);
  }, [addedSections]);

  /**
   * Check if a section is already added by reference ID for a specific session
   */
  const isSectionAdded = useCallback((referenceId: string, sessionId?: string) => {
    // If no sessionId provided, check across all sessions (backward compatibility)
    const sectionsToCheck = sessionId
      ? addedSections.filter(section => section.sessionId === sessionId)
      : addedSections;

    return sectionsToCheck.some(section =>
      section.reference.id === referenceId ||
      `${section.reference.title}_${section.reference.authors}` === referenceId
    );
  }, [addedSections]);

  const contextValue: AddedSectionsContextType = {
    addedSections,
    addSection,
    removeSection,
    clearSections,
    getSectionsForSession,
    isSectionAdded,
    lastCreatedSessionId
  };

  return (
    <AddedSectionsContext.Provider value={contextValue}>
      {children}
    </AddedSectionsContext.Provider>
  );
}

export function useAddedSections(): AddedSectionsContextType {
  const context = useContext(AddedSectionsContext);
  if (!context) {
    throw new Error('useAddedSections must be used within an AddedSectionsProvider');
  }
  return context;
}