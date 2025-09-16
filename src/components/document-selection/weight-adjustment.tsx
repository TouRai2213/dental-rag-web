/**
 * Weight Adjustment Component
 * Allows users to adjust the weight/priority of selected documents
 */

'use client';

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { DocumentMetadata, DocumentSelection } from '@/lib/api/documents';
import { documentSelectionUtils, DEFAULT_WEIGHTS } from '@/hooks/use-document-selection';

interface WeightAdjustmentProps {
  documents: DocumentMetadata[];
  selectedDocuments: DocumentSelection[];
  onUpdateWeight: (documentId: string, weight: number) => void;
  onClearSelection: () => void;
  className?: string;
}

/**
 * Weight adjustment panel for selected documents
 */
export function WeightAdjustment({
  documents,
  selectedDocuments,
  onUpdateWeight,
  onClearSelection,
  className = ''
}: WeightAdjustmentProps) {
  // Create document lookup map
  const documentMap = React.useMemo(() => {
    return documents.reduce((map, doc) => {
      map[doc.id] = doc;
      return map;
    }, {} as Record<string, DocumentMetadata>);
  }, [documents]);

  const handleSliderChange = (documentId: string, values: number[]) => {
    onUpdateWeight(documentId, values[0]);
  };

  const handleInputChange = (documentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 5.0) {
      onUpdateWeight(documentId, numValue);
    }
  };

  const handlePresetWeight = (documentId: string, weight: number) => {
    onUpdateWeight(documentId, weight);
  };

  const handleResetWeight = (documentId: string) => {
    onUpdateWeight(documentId, DEFAULT_WEIGHTS.NORMAL);
  };

  if (selectedDocuments.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <p>No documents selected for weight adjustment</p>
        <p className="text-sm mt-1">Select documents from the list to adjust their search priority</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Weight Adjustment</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-red-600 hover:text-red-700"
        >
          Clear All
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Adjust the search priority for selected documents. Higher weights give more relevance to results from these documents.
      </p>

      {/* Weight Adjustment Cards */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {selectedDocuments.map((selection) => {
          const document = documentMap[selection.document_id];
          if (!document) return null;

          return (
            <Card key={selection.document_id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {documentSelectionUtils.formatDocumentTitle(document)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {documentSelectionUtils.getDocumentSummary(document)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetWeight(selection.document_id)}
                    className="ml-2 h-8 w-8 p-0"
                    title="Reset to normal weight"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Weight Value Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Priority Weight
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={selection.weight.toFixed(1)}
                        onChange={(e) => handleInputChange(selection.document_id, e.target.value)}
                        className="w-16 h-8 text-sm"
                      />
                      <span className={`text-sm font-medium ${documentSelectionUtils.getWeightColorClass(selection.weight)}`}>
                        ({documentSelectionUtils.getWeightLabel(selection.weight)})
                      </span>
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div className="space-y-2">
                    <Slider
                      value={[selection.weight]}
                      onValueChange={(values) => handleSliderChange(selection.document_id, values)}
                      min={0.1}
                      max={5.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (0.1x)</span>
                      <span>Normal (1.0x)</span>
                      <span>High (2.0x)</span>
                      <span>Critical (5.0x)</span>
                    </div>
                  </div>

                  {/* Preset Weight Buttons */}
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetWeight(selection.document_id, DEFAULT_WEIGHTS.LOW)}
                      className={selection.weight === DEFAULT_WEIGHTS.LOW ? 'bg-muted' : ''}
                    >
                      Low
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetWeight(selection.document_id, DEFAULT_WEIGHTS.NORMAL)}
                      className={selection.weight === DEFAULT_WEIGHTS.NORMAL ? 'bg-muted' : ''}
                    >
                      Normal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetWeight(selection.document_id, DEFAULT_WEIGHTS.HIGH)}
                      className={selection.weight === DEFAULT_WEIGHTS.HIGH ? 'bg-muted' : ''}
                    >
                      High
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetWeight(selection.document_id, DEFAULT_WEIGHTS.CRITICAL)}
                      className={selection.weight === DEFAULT_WEIGHTS.CRITICAL ? 'bg-muted' : ''}
                    >
                      Critical
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Separator />
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Selected: {selectedDocuments.length}</strong> document{selectedDocuments.length !== 1 ? 's' : ''}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Weight Range:</span>
            {' '}
            {Math.min(...selectedDocuments.map(s => s.weight)).toFixed(1)}x - {Math.max(...selectedDocuments.map(s => s.weight)).toFixed(1)}x
          </div>
          <div>
            <span className="font-medium">Average Weight:</span>
            {' '}
            {(selectedDocuments.reduce((sum, s) => sum + s.weight, 0) / selectedDocuments.length).toFixed(1)}x
          </div>
        </div>
        
        <p className="mt-2 text-xs">
          <strong>Note:</strong> Higher weights will prioritize results from these documents in literature searches.
        </p>
      </div>
    </div>
  );
}

export default WeightAdjustment;