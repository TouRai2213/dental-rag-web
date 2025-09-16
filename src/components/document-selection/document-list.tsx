/**
 * Document List Component
 * Displays available documents with checkboxes for selection
 */

'use client';

import React from 'react';
import { Search, FileText, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { DocumentMetadata, DocumentSelection } from '@/lib/api/documents';
import { documentSelectionUtils } from '@/hooks/use-document-selection';

interface DocumentListProps {
  documents: DocumentMetadata[];
  selectedDocuments: DocumentSelection[];
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSelection: (documentId: string) => void;
  onViewDetail?: (document: DocumentMetadata) => void;
  className?: string;
}

/**
 * Document List with search and selection functionality
 */
export function DocumentList({
  documents,
  selectedDocuments,
  isLoading = false,
  searchQuery,
  onSearchChange,
  onToggleSelection,
  onViewDetail,
  className = ''
}: DocumentListProps) {
  // Create a map for quick lookup of selected documents
  const selectionMap = React.useMemo(() => {
    return selectedDocuments.reduce((map, sel) => {
      map[sel.document_id] = sel;
      return map;
    }, {} as Record<string, DocumentSelection>);
  }, [selectedDocuments]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleToggleSelection = (documentId: string) => {
    onToggleSelection(documentId);
  };

  const getDocumentTypeIcon = (type: DocumentMetadata['document_type']) => {
    return <FileText className="h-4 w-4" />;
  };

  const getLanguageBadge = (language: DocumentMetadata['language']) => {
    const langMap = {
      'en': 'English',
      'ja': '日本語',
      'mixed': 'Mixed'
    };
    return (
      <Badge variant="outline" className="text-xs">
        {langMap[language] || language}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled
            className="flex-1"
          />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents by title, author, or keywords..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1"
        />
      </div>

      {/* Documents List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents found</p>
            {searchQuery && (
              <p className="text-sm mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          documents.map((document) => {
            const selection = selectionMap[document.id];
            const isSelected = !!selection;
            
            return (
              <Card 
                key={document.id} 
                className={`transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Selection Checkbox */}
                    <Checkbox
                      id={`doc-${document.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelection(document.id)}
                      className="mt-1"
                    />
                    
                    {/* Document Content */}
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`doc-${document.id}`}
                        className="block cursor-pointer"
                      >
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-sm leading-tight line-clamp-2">
                            {documentSelectionUtils.formatDocumentTitle(document)}
                          </h3>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {getDocumentTypeIcon(document.document_type)}
                            {getLanguageBadge(document.language)}
                          </div>
                        </div>
                        
                        {/* Authors and Journal */}
                        <p className="text-xs text-muted-foreground mb-2">
                          {documentSelectionUtils.getDocumentSummary(document)}
                        </p>
                        
                        {/* Abstract Preview */}
                        {document.abstract && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {document.abstract}
                          </p>
                        )}
                        
                        {/* Keywords */}
                        {document.keywords && document.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {document.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                {keyword}
                              </Badge>
                            ))}
                            {document.keywords.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                +{document.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* External Links */}
                        {(document.doi || document.pmid) && (
                          <div className="flex items-center space-x-2 text-xs">
                            {document.pmid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://pubmed.ncbi.nlm.nih.gov/${document.pmid}`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                PubMed
                              </Button>
                            )}
                            {document.doi && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1 text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://doi.org/${document.doi}`, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                DOI
                              </Button>
                            )}
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                  
                  {/* Selection Status */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Selected for boosting</span>
                        <span className={`font-medium ${documentSelectionUtils.getWeightColorClass(selection.weight)}`}>
                          Weight: {selection.weight}x ({documentSelectionUtils.getWeightLabel(selection.weight)})
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Selection Summary */}
      {selectedDocuments.length > 0 && (
        <>
          <Separator />
          <div className="text-sm text-muted-foreground">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected for weight boosting
          </div>
        </>
      )}
    </div>
  );
}

export default DocumentList;