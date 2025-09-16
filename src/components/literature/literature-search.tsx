/**
 * Literature Search Component
 * Provides search interface for literature queries with input field and search button
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LiteratureSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Literature search input component
 */
export function LiteratureSearch({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Search dental literature (e.g., 'cephalometric analysis orthodontics')",
  className = '' 
}: LiteratureSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery && !isLoading) {
      onSearch(trimmedQuery);
    }
  }, [query, onSearch, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  return (
    <Card className={`p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <h3 className="font-semibold text-lg">Literature Search</h3>
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!query.trim() || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Search supports both English and Japanese dental terminology. 
          Results combine local database and PubMed sources.</p>
        </div>
      </form>
    </Card>
  );
}

export default LiteratureSearch;