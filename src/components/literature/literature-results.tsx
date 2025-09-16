/**
 * Literature Results Component
 * Displays literature search results with PubMed links and source identification
 */

'use client';

import React from 'react';
import { BookOpen, ExternalLink, Eye, Database, Globe, Plus, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { useAddedSections } from '@/hooks/use-added-sections';
import type { LiteratureReference } from '@/types/conversation';
import type { LiteratureSearchResponse } from '@/lib/api/literature';

interface LiteratureResultsProps {
  results: LiteratureSearchResponse | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  sessionId?: string;
  onViewDetail?: (reference: LiteratureReference) => void;
  onAddSection?: (reference: LiteratureReference, actualSessionId?: string) => void;
}

interface ResultItemProps {
  reference: LiteratureReference;
  index: number;
  sessionId?: string;
  onViewDetail?: (reference: LiteratureReference) => void;
  onAddSection?: (reference: LiteratureReference, actualSessionId?: string) => void;
}

/**
 * Get source icon and label based on document source and PubMed ID
 */
function getSourceInfo(reference: LiteratureReference) {
  // Check document_source first (more reliable), then fallback to pmid
  if (reference.document_source === 'pubmed' || reference.pmid) {
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
 * Individual result item component
 */
function ResultItem({ reference, index, sessionId, onViewDetail, onAddSection }: ResultItemProps) {
  const { addSection, isSectionAdded } = useAddedSections();
  
  // Check if this section is already added for the current session
  const isAdded = isSectionAdded(reference.id || `${reference.title}_${reference.authors}`, sessionId);
  const sourceInfo = getSourceInfo(reference);
  const SourceIcon = sourceInfo.icon;

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (score >= 0.6) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  };

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

  const handlePubMedLink = () => {
    if (reference.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDoiLink = () => {
    if (reference.doi) {
      window.open(`https://doi.org/${reference.doi}`, '_blank', 'noopener,noreferrer');
    }
  };
  
  const handleAddSection = async () => {
    if (!isAdded) {
      try {
        const actualSessionId = await addSection(reference, sessionId);
        console.log(`Added to session: ${actualSessionId}`);
        onAddSection?.(reference, actualSessionId);
      } catch (error) {
        console.error('Failed to add section:', error);
      }
    }
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow border-l-4" 
          style={{ borderLeftColor: sourceInfo.color.includes('blue') ? '#2563eb' : '#059669' }}>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${sourceInfo.bgColor}`}>
              <SourceIcon className={`w-3 h-3 ${sourceInfo.color}`} />
              <span className={sourceInfo.color}>{sourceInfo.label}</span>
            </div>
            {reference.relevance_score && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRelevanceColor(reference.relevance_score)}`}
              >
                {Math.round(reference.relevance_score * 100)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {reference.title}
        </h4>

        {/* Authors and Journal */}
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium">{formatAuthors(reference.authors)}</span>
            {reference.year && <span className="ml-1">({reference.year})</span>}
          </p>
          {reference.journal && <p className="italic mt-1">{reference.journal}</p>}
        </div>

        {/* Excerpt */}
        {reference.excerpt && (
          <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
            <p className="line-clamp-2">{reference.excerpt}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {reference.pmid && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePubMedLink}
                className="h-6 text-xs px-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                PubMed
              </Button>
            )}
            {reference.doi && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDoiLink}
                className="h-6 text-xs px-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                DOI
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onViewDetail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(reference)}
                className="h-6 text-xs px-2"
              >
                <Eye className="w-3 h-3 mr-1" />
                詳細
              </Button>
            )}
            <Button
              variant={isAdded ? "secondary" : "default"}
              size="sm"
              onClick={handleAddSection}
              disabled={isAdded}
              className={`h-6 text-xs px-2 ${
                isAdded 
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300' 
                  : ''
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  追加済み
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  セッションに追加
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Main literature results component
 */
export function LiteratureResults({ 
  results, 
  isLoading = false, 
  error = null, 
  className = '',
  sessionId,
  onViewDetail,
  onAddSection 
}: LiteratureResultsProps) {

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Searching Literature...</h3>
        </div>
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Search Error"
        description={error}
        className={className}
      />
    );
  }

  // No results
  if (!results || !results.results || results.results.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Results Found"
        description="Try different search terms or check your spelling. Use both English and Japanese dental terminology for best results."
        className={className}
      />
    );
  }

  const displayResults = results.results;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Literature Results</h3>
          <Badge variant="secondary" className="text-xs">
            {results.total_results} found
          </Badge>
          <span className="text-xs text-gray-500">
            ({results.search_time_ms}ms)
          </span>
        </div>
      </div>

      {/* Search Query Display */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
        <span className="font-medium">Query:</span> "{results.query}"
      </div>

      {/* Results Grid */}
      <div className="grid gap-2">
        {displayResults.map((reference, index) => (
          <ResultItem
            key={`${reference.id || reference.title}-${index}`}
            reference={reference}
            index={index}
            sessionId={sessionId}
            onViewDetail={onViewDetail}
            onAddSection={onAddSection}
          />
        ))}
      </div>
    </div>
  );
}

export default LiteratureResults;