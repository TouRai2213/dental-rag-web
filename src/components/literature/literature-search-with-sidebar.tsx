/**
 * Literature Search with Added Sections Sidebar
 * Comprehensive literature search interface with sidebar showing added documents
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LiteratureSearchContainer } from './literature-search-container';
import { AddedSectionsSidebar } from '@/components/chat/added-sections-sidebar';
import { useAddedSections } from '@/hooks/use-added-sections';
import type { LiteratureReference } from '@/types/conversation';

interface LiteratureSearchWithSidebarProps {
  trigger?: React.ReactNode;
  sessionId?: string;
  onViewDetail?: (reference: LiteratureReference) => void;
  className?: string;
}

/**
 * Main literature search component with integrated sidebar for added sections
 */
export function LiteratureSearchWithSidebar({
  trigger,
  sessionId,
  onViewDetail,
  className = ''
}: LiteratureSearchWithSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessionId || 'default-session');
  const { getSectionsForSession } = useAddedSections();
  
  // Get sections for current session
  const addedSections = getSectionsForSession(currentSessionId);

  // Update currentSessionId when sessionId prop changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      console.log(`LiteratureSearchWithSidebar: Updating session ID from ${currentSessionId} to ${sessionId}`);
      setCurrentSessionId(sessionId);
    }
  }, [sessionId, currentSessionId]);

  const handleAddSection = useCallback((reference: LiteratureReference, actualSessionId?: string) => {
    console.log('Section added to session:', reference.title);
    // Update our session ID to match the one actually used if provided
    if (actualSessionId && actualSessionId !== currentSessionId) {
      console.log(`Updating session ID from ${currentSessionId} to ${actualSessionId}`);
      setCurrentSessionId(actualSessionId);
    }
    // Force a re-render to update the sidebar
    setForceUpdate(prev => prev + 1);
  }, [currentSessionId]);

  const handleRemoveSection = useCallback((sectionId: string) => {
    console.log('Section removed from session:', sectionId);
    // Force a re-render to update the sidebar
    setForceUpdate(prev => prev + 1);
  }, []);

  const defaultTrigger = (
    <Button
      variant="outline"
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
      "
    >
      <Search className="w-4 h-4 text-black mr-2 flex-shrink-0" />
      <span className="text-[14px] font-normal text-black font-roboto">
        歯科文献を検索
      </span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[85vh] h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>文献検索</span>
            {addedSections.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({addedSections.length} 件追加済み)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main Search Area */}
          <div className="flex-1 p-6 pr-3 flex flex-col min-h-0">
            <LiteratureSearchContainer
              sessionId={currentSessionId}
              onViewDetail={onViewDetail}
              onAddSection={handleAddSection}
              limit={15}
              className="flex-1 min-h-0 flex flex-col"
            />
          </div>
          
          {/* Sidebar for Added Sections */}
          <div className="flex-shrink-0 p-6 pl-3 border-l bg-gray-50 dark:bg-gray-800/50">
            <AddedSectionsSidebar
              key={forceUpdate}
              sessionId={currentSessionId}
              onRemoveSection={handleRemoveSection}
              onViewReference={onViewDetail}
              className="h-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiteratureSearchWithSidebar;