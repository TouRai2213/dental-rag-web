/**
 * Document Selection Modal Component
 * Main modal for document selection and weight adjustment
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Settings, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DocumentList } from './document-list';
import { WeightAdjustment } from './weight-adjustment';
import { useDocumentSelection } from '@/hooks/use-document-selection';
import type { DocumentMetadata } from '@/lib/api/documents';

interface DocumentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySelection: (selectedDocumentIds: string[]) => void;
  initialSelectedIds?: string[];
  className?: string;
}

type TabType = 'documents' | 'weights';

/**
 * Document Selection Modal with tabbed interface
 */
export function DocumentSelectionModal({
  isOpen,
  onClose,
  onApplySelection,
  initialSelectedIds = [],
  className = ''
}: DocumentSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const {
    documents,
    selectedDocuments,
    selectedDocumentIds,
    loading,
    error,
    loadDocuments,
    searchDocuments,
    toggleDocumentSelection,
    updateDocumentWeight,
    clearSelection,
    clearError,
  } = useDocumentSelection();

  // Initialize selected documents when modal opens
  useEffect(() => {
    if (isOpen && initialSelectedIds.length > 0) {
      // TODO: If we had a way to get document metadata by ID, we'd select them here
      // For now, we'll load all documents and then select the matching ones
      loadDocuments().then(() => {
        initialSelectedIds.forEach(id => {
          if (!selectedDocumentIds.includes(id)) {
            toggleDocumentSelection(id);
          }
        });
      });
    } else if (isOpen && documents.length === 0) {
      loadDocuments();
    }
  }, [isOpen, initialSelectedIds, loadDocuments]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        setSearchQuery(localSearchQuery);
        if (localSearchQuery.trim()) {
          searchDocuments({ query: localSearchQuery.trim() });
        } else {
          loadDocuments();
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchQuery, searchDocuments, loadDocuments]);

  const handleSearchChange = useCallback((query: string) => {
    setLocalSearchQuery(query);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleApplySelection = useCallback(() => {
    onApplySelection(selectedDocumentIds);
    onClose();
  }, [selectedDocumentIds, onApplySelection, onClose]);

  const handleClose = useCallback(() => {
    setActiveTab('documents');
    setSearchQuery('');
    setLocalSearchQuery('');
    clearError();
    onClose();
  }, [clearError, onClose]);

  const handleViewDetail = useCallback((document: DocumentMetadata) => {
    // For now, we'll just log the document
    // In a full implementation, this might open a detail modal
    console.log('View document detail:', document);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl h-[80vh] flex flex-col ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Document Selection</span>
            {selectedDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedDocuments.length} selected
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select documents to boost their priority in literature searches. Higher weights give more relevance to results from these documents.
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error.message}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-1 h-6 px-2 text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-b">
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('documents')}
            className="flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Select Documents</span>
          </Button>
          <Button
            variant={activeTab === 'weights' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('weights')}
            disabled={selectedDocuments.length === 0}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Adjust Weights</span>
            {selectedDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedDocuments.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'documents' && (
            <div className="h-full py-4">
              <DocumentList
                documents={documents}
                selectedDocuments={selectedDocuments}
                isLoading={loading.documents || loading.searching}
                searchQuery={localSearchQuery}
                onSearchChange={handleSearchChange}
                onToggleSelection={toggleDocumentSelection}
                onViewDetail={handleViewDetail}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'weights' && (
            <div className="h-full py-4">
              <WeightAdjustment
                documents={documents}
                selectedDocuments={selectedDocuments}
                onUpdateWeight={updateDocumentWeight}
                onClearSelection={clearSelection}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </span>
            {selectedDocuments.length > 0 && (
              <span>
                Avg weight: {(selectedDocuments.reduce((sum, s) => sum + s.weight, 0) / selectedDocuments.length).toFixed(1)}x
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApplySelection}
              disabled={selectedDocuments.length === 0}
            >
              Apply Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentSelectionModal;