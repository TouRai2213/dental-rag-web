'use client';

import React, { useState, useCallback } from 'react';
import { Search, ExternalLink, BookOpen, Database, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { literatureApi } from '@/lib/api/literature';
import type { LiteratureReference } from '@/types/conversation';

interface LiteratureResult {
  document_id: string;
  title: string;
  authors: string | string[]; // Can be string or array
  content_preview?: string; // Backend uses content_preview instead of abstract
  url?: string;
  doi?: string;
  pmid?: string;
  source: string;
  search_source: 'local' | 'pubmed';
  score: number; // Backend uses score instead of relevance_score
  relevance_score?: number; // Keep for backwards compatibility
  keywords?: string[];
  year?: string | number; // Backend returns year as string
  journal?: string;
  selectable?: boolean;
}

interface LiteratureSearchDialogProps {
  trigger?: React.ReactNode;
  onAddToSession?: (literature: LiteratureReference, weight: number) => void;
}

export function LiteratureSearchDialog({ trigger, onAddToSession }: LiteratureSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LiteratureReference[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLiterature, setSelectedLiterature] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    
    try {
      const searchResults = await literatureApi.search(searchQuery, { limit: 20 });
      setResults(searchResults.results);
    } catch (err: any) {
      setError(err.message || 'Failed to search literature');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleAddToSession = useCallback((literature: LiteratureReference, weight: number = 1.5) => {
    const literatureId = literature.doc_uid || `${literature.pmid || literature.title}`;
    setSelectedLiterature(prev => new Set([...prev, literatureId]));
    
    if (onAddToSession) {
      onAddToSession(literature, weight);
    }
  }, [onAddToSession]);

  const isSelected = (literature: LiteratureReference) => {
    const literatureId = literature.doc_uid || `${literature.pmid || literature.title}`;
    return selectedLiterature.has(literatureId);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const defaultTrigger = (
    <button 
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
      <div 
        className="w-4 h-4 mr-2 flex-shrink-0"
        style={{
          maskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M5 4v6.333v-.025V20zv4zm.616 17q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.244-.086-.494-.121T17 10.333V8h-4V4H5.616q-.231 0-.424.192T5 4.615v14.77q0 .23.192.423t.423.192h5.776q.188.292.418.536q.232.243.485.464zM16.5 19.308q1.185 0 1.996-.812q.812-.811.812-1.996t-.812-1.996t-1.996-.812t-1.996.812t-.812 1.996t.812 1.996t1.996.812m5.1 2.98l-2.777-2.776q-.487.388-1.08.592t-1.243.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .65-.203 1.243t-.593 1.08L22.29 21.6z'/%3E%3C/svg%3E\")",
          WebkitMaskImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M5 4v6.333v-.025V20zv4zm.616 17q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.244-.086-.494-.121T17 10.333V8h-4V4H5.616q-.231 0-.424.192T5 4.615v14.77q0 .23.192.423t.423.192h5.776q.188.292.418.536q.232.243.485.464zM16.5 19.308q1.185 0 1.996-.812q.812-.811.812-1.996t-.812-1.996t-1.996-.812t-1.996.812t-.812 1.996t.812 1.996t1.996.812m5.1 2.98l-2.777-2.776q-.487.388-1.08.592t-1.243.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .65-.203 1.243t-.593 1.08L22.29 21.6z'/%3E%3C/svg%3E\")",
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          backgroundColor: '#000000'
        }}
      />
      <span className="text-[14px] font-normal text-black font-roboto whitespace-nowrap">
        歯科文献を検索
      </span>
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>歯科文献検索</span>
          </DialogTitle>
          <DialogDescription>
            Search dental literature database for relevant research papers and studies
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索キーワードを入力してください（例：歯周病、インプラント、虫歯）"
                className="pr-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
              className="px-6"
            >
              {isSearching ? '検索中...' : '検索'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">検索結果 ({results.length}件)</h3>
                <p className="text-sm text-gray-600">
                  文献を選択して会話に重み付けで追加できます
                </p>
              </div>
              
              <div className="space-y-3">
                {results.map((literature, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1 space-y-2">
                        {/* Title and Source */}
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-base leading-tight">{literature.title}</h4>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {literature.document_source === 'pubmed' ? (
                              <Database className="w-3 h-3" />
                            ) : (
                              <BookOpen className="w-3 h-3" />
                            )}
                            <span>{literature.document_source === 'pubmed' ? 'PubMed' : 'Local DB'}</span>
                          </Badge>
                        </div>

                        {/* Authors and Year */}
                        {literature.authors && (
                          <p className="text-sm text-gray-600">
                            {typeof literature.authors === 'string' 
                              ? literature.authors
                              : literature.authors.slice(0, 3).join(', ')
                            }
                            {Array.isArray(literature.authors) && literature.authors.length > 3 && ' et al.'}
                            {literature.year && ` (${literature.year})`}
                          </p>
                        )}

                        {/* Relevance Score */}
                        <div className="flex items-center space-x-2">
                          <Badge className={getRelevanceColor(literature.relevance_score || 0)}>
                            関連度: {Math.round((literature.relevance_score || 0) * 100)}%
                          </Badge>
                        </div>


                        {/* External Links */}
                        <div className="flex items-center space-x-3">
                          {literature.doi && (
                            <a
                              href={`https://doi.org/${literature.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>DOI</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Add to Session Button */}
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant={isSelected(literature) ? "default" : "outline"}
                          onClick={() => handleAddToSession(literature)}
                          disabled={isSelected(literature)}
                          className="whitespace-nowrap"
                        >
                          {isSelected(literature) ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              追加済み
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              セッションに追加
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Abstract Preview */}
                    {literature.content_preview && (
                      <>
                        <Separator className="my-3" />
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <p className="font-medium mb-1">要約:</p>
                          <p className="line-clamp-3">{literature.content_preview}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isSearching && results.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりませんでした</h3>
              <p className="text-gray-500">
                検索キーワードを変更して再度お試しください
              </p>
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="text-center py-8">
              <div className="flex space-x-1 justify-center mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-gray-500">文献を検索しています...</p>
            </div>
          )}

          {/* Initial State */}
          {!isSearching && results.length === 0 && !searchQuery && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">歯科文献を検索</h3>
              <p className="text-gray-500 mb-4">
                検索キーワードを入力して関連する歯科文献を探してください
              </p>
              <p className="text-sm text-gray-400">
                検索対象: PubMed + ローカルデータベース
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}