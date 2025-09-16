/**
 * Integrated Literature Search Component
 * Example integration of Stream A (Literature Search) and Stream B (Document Selection)
 */

'use client';

import React, { useState } from 'react';
import { FileText, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiteratureSearchContainer } from '@/components/literature';
import { DocumentSelectionModal } from './document-selection-modal';
import type { LiteratureReference } from '@/types/conversation';

interface IntegratedLiteratureSearchProps {
  onViewDetail?: (reference: LiteratureReference) => void;
  className?: string;
}

/**
 * Combined component showing literature search with document selection
 * This demonstrates how Stream A and Stream B components work together
 */
export function IntegratedLiteratureSearch({
  onViewDetail,
  className = ''
}: IntegratedLiteratureSearchProps) {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const handleOpenDocumentModal = () => {
    setIsDocumentModalOpen(true);
  };

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false);
  };

  const handleApplyDocumentSelection = (documentIds: string[]) => {
    setSelectedDocumentIds(documentIds);
  };

  const handleClearSelection = () => {
    setSelectedDocumentIds([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Selection Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Enhanced Literature Search</span>
            </CardTitle>
            <Button onClick={handleOpenDocumentModal} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Select Documents
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Document Weight Boosting:
              </span>
              <Badge variant={selectedDocumentIds.length > 0 ? "default" : "secondary"}>
                {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
            {selectedDocumentIds.length > 0 && (
              <Button 
                onClick={handleClearSelection}
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Clear Selection
              </Button>
            )}
          </div>
          
          {selectedDocumentIds.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Active Enhancement:</strong> Search results will prioritize content from your selected documents.
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDocumentIds.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Literature Search Component (Stream A) with Document Selection (Stream B) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Literature Search</h2>
          {selectedDocumentIds.length > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Enhanced with {selectedDocumentIds.length} selected document{selectedDocumentIds.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {/* Integration Point: Pass selectedDocumentIds as userDocIds to literature search */}
        <LiteratureSearchContainer
          userDocIds={selectedDocumentIds} // This is the key integration!
          onViewDetail={onViewDetail}
          limit={10}
        />
      </div>

      {/* Document Selection Modal */}
      <DocumentSelectionModal
        isOpen={isDocumentModalOpen}
        onClose={handleCloseDocumentModal}
        onApplySelection={handleApplyDocumentSelection}
        initialSelectedIds={selectedDocumentIds}
      />

      {/* Integration Notes (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-yellow-400 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">
              Stream Integration Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-yellow-700 space-y-2">
            <p>
              <strong>Stream A (Literature):</strong> Handles literature search API calls and result display
            </p>
            <p>
              <strong>Stream B (Documents):</strong> Provides document selection and weight management
            </p>
            <p>
              <strong>Integration:</strong> Selected document IDs are passed as `userDocIds` to enhance search relevance
            </p>
            {selectedDocumentIds.length > 0 && (
              <p>
                <strong>Active:</strong> Currently using {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} for weight boosting
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IntegratedLiteratureSearch;