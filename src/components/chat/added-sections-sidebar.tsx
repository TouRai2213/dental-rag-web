/**
 * Added Sections Sidebar Component
 * Displays a list of literature references that have been added to the current chat session
 */

'use client';

import React from 'react';
import { X, BookOpen, Database, Globe, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { useAddedSections } from '@/hooks/use-added-sections';
import type { LiteratureReference } from '@/types/conversation';

interface AddedSectionsSidebarProps {
  sessionId?: string;
  className?: string;
  onRemoveSection?: (sectionId: string) => void;
  onViewReference?: (reference: LiteratureReference) => void;
}

/**
 * Get source icon and label based on PubMed ID presence
 */
function getSourceInfo(reference: LiteratureReference) {
  if (reference.pmid) {
    return {
      icon: Globe,
      label: 'PubMed',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    };
  }
  return {
    icon: Database,
    label: 'Local DB',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950'
  };
}

/**
 * Format time ago string
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return '今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`;
  return `${Math.floor(diffMins / 1440)}日前`;
}

/**
 * Individual added section item
 */
interface SectionItemProps {
  section: {
    id: string;
    reference: LiteratureReference;
    addedAt: Date;
  };
  onRemove: (id: string) => void;
  onView?: (reference: LiteratureReference) => void;
}

function SectionItem({ section, onRemove, onView }: SectionItemProps) {
  const { reference, addedAt, id } = section;
  const sourceInfo = getSourceInfo(reference);
  const SourceIcon = sourceInfo.icon;

  const formatAuthors = (authors: string | string[] | undefined | null) => {
    if (!authors) return 'Unknown Authors';
    
    // Handle array of authors
    if (Array.isArray(authors)) {
      if (authors.length <= 2) return authors.join(', ');
      return `${authors[0]} et al.`;
    }
    
    // Handle string of authors
    if (typeof authors === 'string') {
      const authorList = authors.split(',').map(a => a.trim());
      if (authorList.length <= 2) return authors;
      return `${authorList[0]} et al.`;
    }
    
    return 'Unknown Authors';
  };

  return (
    <Card className="mb-3 border-l-4" 
          style={{ borderLeftColor: sourceInfo.color.includes('blue') ? '#2563eb' : '#059669' }}>
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header with source and remove button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${sourceInfo.bgColor}`}>
                <SourceIcon className={`w-3 h-3 ${sourceInfo.color}`} />
                <span className={sourceInfo.color}>{sourceInfo.label}</span>
              </div>
              {reference.relevance_score && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(reference.relevance_score * 100)}%
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {reference.title}
          </h4>

          {/* Authors and year */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium">{formatAuthors(reference.authors)}</span>
              {reference.year && <span className="ml-1">({reference.year})</span>}
            </p>
          </div>

          {/* Added time */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(addedAt)}</span>
            </div>
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(reference)}
                className="h-5 text-xs px-1 text-blue-600 hover:text-blue-800"
              >
                詳細
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main added sections sidebar component
 */
export function AddedSectionsSidebar({ 
  sessionId, 
  className = '',
  onRemoveSection,
  onViewReference 
}: AddedSectionsSidebarProps) {
  const { getSectionsForSession, removeSection, clearSections } = useAddedSections();
  // Use the same sessionId logic as the parent component
  const effectiveSessionId = sessionId || 'default-session';
  const sections = getSectionsForSession(effectiveSessionId);
  
  // Debug localStorage contents
  React.useEffect(() => {
    const stored = localStorage.getItem('dental-rag-added-sections');
    console.log('AddedSectionsSidebar:', { 
      sessionId, 
      effectiveSessionId, 
      sectionsLength: sections.length,
      localStorageData: stored ? JSON.parse(stored) : null
    });
  }, [sessionId, effectiveSessionId, sections.length]);

  const handleRemove = (sectionId: string) => {
    removeSection(sectionId);
    onRemoveSection?.(sectionId);
  };

  const handleClearAll = () => {
    clearSections(effectiveSessionId);
  };

  if (sections.length === 0) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>追加された文献</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpen}
            title="文献が追加されていません"
            description="検索結果から「セッションに追加」ボタンで文献を追加してください"
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>追加された文献</span>
            <Badge variant="secondary" className="text-xs">
              {sections.length}
            </Badge>
          </CardTitle>
          {sections.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 h-6 px-2"
            >
              全削除
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-0">
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              onRemove={handleRemove}
              onView={onViewReference}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default AddedSectionsSidebar;