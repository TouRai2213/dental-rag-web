'use client';

import React, { useState } from 'react';
import { FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DocumentSelectionModal, IntegratedLiteratureSearch } from '@/components/document-selection';

export default function DocumentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleApplySelection = (documentIds: string[]) => {
    setSelectedDocumentIds(documentIds);
    console.log('Selected document IDs for boosting:', documentIds);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Document Management</h1>
          <p className="text-muted-foreground">
            Select and prioritize documents for enhanced literature search results
          </p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Select Documents</span>
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Document Selection</span>
          </h2>
          
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Documents</span>
              <Badge variant={selectedDocumentIds.length > 0 ? "default" : "secondary"}>
                {selectedDocumentIds.length} selected
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Documents selected for priority boosting in literature searches. 
              These documents will have higher relevance scores in search results.
            </p>
            
            {selectedDocumentIds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Document IDs:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocumentIds.map((id) => (
                    <Badge key={id} variant="outline" className="font-mono text-xs">
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleOpenModal}
              variant={selectedDocumentIds.length > 0 ? "outline" : "default"}
              size="sm"
              className="w-full"
            >
              {selectedDocumentIds.length > 0 ? 'Modify Selection' : 'Select Documents'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Integration Status</h2>
          
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Document Selection UI</span>
                <Badge variant="default" className="bg-green-500">✓ Complete</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Weight Adjustment</span>
                <Badge variant="default" className="bg-green-500">✓ Complete</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">API Client</span>
                <Badge variant="default" className="bg-green-500">✓ Complete</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Literature Integration</span>
                <Badge variant="outline" className="bg-blue-500 text-white">Ready</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <p><strong>Next Steps:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Integrate with literature search components</li>
                <li>Connect to chat interface</li>
                <li>Link with backend document endpoints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Literature Search Demo */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stream Integration Demo</h2>
        <div className="bg-muted/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-4">
            This demonstrates how Stream A (Literature Search) and Stream B (Document Selection) work together:
          </p>
          
          <IntegratedLiteratureSearch />
        </div>
      </div>

      {/* Document Selection Modal */}
      <DocumentSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApplySelection={handleApplySelection}
        initialSelectedIds={selectedDocumentIds}
      />
    </div>
  );
}