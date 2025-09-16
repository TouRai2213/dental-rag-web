/**
 * Literature Search Container Component
 * Combines LiteratureSearch and LiteratureResults with state management
 */

'use client';

import React, { useState, useCallback } from 'react';
// No toast library - using inline feedback
import { LiteratureSearch } from './literature-search';
import { LiteratureResults } from './literature-results';
import { literatureApi } from '@/lib/api/literature';
import type { LiteratureSearchResponse } from '@/lib/api/literature';
import type { LiteratureReference } from '@/types/conversation';

interface LiteratureSearchContainerProps {
  className?: string;
  sessionId?: string;
  onViewDetail?: (reference: LiteratureReference) => void;
  onAddSection?: (reference: LiteratureReference, actualSessionId?: string) => void;
  initialQuery?: string;
  limit?: number;
  userDocIds?: string[];
}

/**
 * Main literature search container with integrated state management
 */
export function LiteratureSearchContainer({
  className = '',
  sessionId,
  onViewDetail,
  onAddSection,
  initialQuery = '',
  limit = 10,
  userDocIds = []
}: LiteratureSearchContainerProps) {
  const [results, setResults] = useState<LiteratureSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const searchResults = await literatureApi.search(query, {
        limit,
        userDocIds: userDocIds.length > 0 ? userDocIds : undefined
      });
      
      setResults(searchResults);
      
      // Log success for debugging
      const resultCount = searchResults.results.length;
      const searchTime = Math.round(searchResults.search_time_ms);
      console.log(`Literature search: Found ${resultCount} results in ${searchTime}ms`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search literature';
      setError(errorMessage);
      setResults(null);
      console.error('Literature search error:', err);
      
    } finally {
      setIsLoading(false);
    }
  }, [limit, userDocIds]);

  const handleClearResults = useCallback(() => {
    setResults(null);
    setError(null);
    setCurrentQuery('');
  }, []);

  return (
    <div className={`flex flex-col space-y-6 ${className}`}>
      {/* Search Input */}
      <div className="flex-shrink-0">
        <LiteratureSearch
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Search dental literature (e.g., 'cephalometric analysis orthodontics', '頭部X線規格写真分析')"
        />
      </div>

      {/* Search Results */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <LiteratureResults
          results={results}
          isLoading={isLoading}
          error={error}
          sessionId={sessionId}
          onViewDetail={onViewDetail}
          onAddSection={onAddSection}
        />
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && results && (
        <details className="text-xs text-gray-500 border rounded p-2">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 text-xs overflow-x-auto">
            {JSON.stringify({
              query: currentQuery,
              total_results: results.total_results,
              search_time_ms: results.search_time_ms,
              result_count: results.results.length,
              user_doc_ids: userDocIds.length > 0 ? userDocIds : 'none'
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default LiteratureSearchContainer;