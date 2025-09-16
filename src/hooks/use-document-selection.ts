/**
 * React hook for document selection and weight management
 * Provides state management for document selection modal and weight boosting
 */

import { useState, useCallback, useEffect } from 'react';
import { documentsApi } from '@/lib/api/documents';
import type {
  DocumentMetadata,
  DocumentSelection,
  ListDocumentsRequest,
  SearchDocumentsRequest
} from '@/lib/api/documents';

/**
 * Loading states for document operations
 */
interface DocumentSelectionLoadingState {
  documents: boolean;
  searching: boolean;
}

/**
 * Error state for document operations
 */
interface DocumentSelectionError {
  message: string;
  code?: string;
}

/**
 * Hook return type
 */
export interface UseDocumentSelectionReturn {
  // Data
  documents: DocumentMetadata[];
  selectedDocuments: DocumentSelection[];
  selectedDocumentIds: string[];
  
  // State
  loading: DocumentSelectionLoadingState;
  error: DocumentSelectionError | null;
  isModalOpen: boolean;
  
  // Actions
  loadDocuments: (request?: ListDocumentsRequest) => Promise<void>;
  searchDocuments: (request: SearchDocumentsRequest) => Promise<void>;
  toggleDocumentSelection: (documentId: string) => void;
  updateDocumentWeight: (documentId: string, weight: number) => void;
  clearSelection: () => void;
  openModal: () => void;
  closeModal: () => void;
  clearError: () => void;
}

/**
 * Default weight values for different priority levels
 */
export const DEFAULT_WEIGHTS = {
  LOW: 0.5,
  NORMAL: 1.0,
  HIGH: 2.0,
  CRITICAL: 3.0
} as const;

/**
 * Custom hook for managing document selection state
 */
export function useDocumentSelection(): UseDocumentSelectionReturn {
  // State management
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentSelection[]>([]);
  const [loading, setLoading] = useState<DocumentSelectionLoadingState>({
    documents: false,
    searching: false
  });
  const [error, setError] = useState<DocumentSelectionError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Update specific loading state
   */
  const updateLoadingState = useCallback((key: keyof DocumentSelectionLoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Handle and set errors
   */
  const handleError = useCallback((err: any, context?: string) => {
    console.error(`Document selection error${context ? ` in ${context}` : ''}:`, err);
    
    const errorMessage = err?.message || 'An unexpected error occurred';
    setError({
      message: errorMessage,
      code: err?.code,
    });
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load documents with optional filtering
   */
  const loadDocuments = useCallback(async (request: ListDocumentsRequest = {}) => {
    try {
      updateLoadingState('documents', true);
      clearError();
      
      const response = await documentsApi.listDocuments(request);
      setDocuments(response.documents);
    } catch (err) {
      handleError(err, 'loadDocuments');
    } finally {
      updateLoadingState('documents', false);
    }
  }, [updateLoadingState, clearError, handleError]);

  /**
   * Search documents by query
   */
  const searchDocuments = useCallback(async (request: SearchDocumentsRequest) => {
    try {
      updateLoadingState('searching', true);
      clearError();
      
      const response = await documentsApi.searchDocuments(request);
      setDocuments(response.documents);
    } catch (err) {
      handleError(err, 'searchDocuments');
    } finally {
      updateLoadingState('searching', false);
    }
  }, [updateLoadingState, clearError, handleError]);

  /**
   * Toggle document selection (add/remove from selection)
   */
  const toggleDocumentSelection = useCallback((documentId: string) => {
    setSelectedDocuments(prev => {
      const existing = prev.find(sel => sel.document_id === documentId);
      
      if (existing) {
        // Remove from selection
        return prev.filter(sel => sel.document_id !== documentId);
      } else {
        // Add to selection with default weight
        return [...prev, {
          document_id: documentId,
          weight: DEFAULT_WEIGHTS.NORMAL,
          selected: true
        }];
      }
    });
  }, []);

  /**
   * Update weight for a selected document
   */
  const updateDocumentWeight = useCallback((documentId: string, weight: number) => {
    setSelectedDocuments(prev => 
      prev.map(sel => 
        sel.document_id === documentId 
          ? { ...sel, weight: Math.max(0.1, Math.min(5.0, weight)) } // Clamp between 0.1 and 5.0
          : sel
      )
    );
  }, []);

  /**
   * Clear all document selections
   */
  const clearSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  /**
   * Open the document selection modal
   */
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    // Auto-load documents when modal opens
    if (documents.length === 0) {
      loadDocuments();
    }
  }, [documents.length, loadDocuments]);

  /**
   * Close the document selection modal
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * Get selected document IDs for API calls
   */
  const selectedDocumentIds = selectedDocuments
    .filter(sel => sel.selected)
    .map(sel => sel.document_id);

  return {
    // Data
    documents,
    selectedDocuments,
    selectedDocumentIds,
    
    // State
    loading,
    error,
    isModalOpen,
    
    // Actions
    loadDocuments,
    searchDocuments,
    toggleDocumentSelection,
    updateDocumentWeight,
    clearSelection,
    openModal,
    closeModal,
    clearError,
  };
}

/**
 * Utility functions for working with document selections
 */
export const documentSelectionUtils = {
  /**
   * Get weight label for display
   */
  getWeightLabel: (weight: number): string => {
    if (weight <= 0.5) return 'Low Priority';
    if (weight <= 1.0) return 'Normal';
    if (weight <= 2.0) return 'High Priority';
    return 'Critical';
  },

  /**
   * Get weight color class for UI
   */
  getWeightColorClass: (weight: number): string => {
    if (weight <= 0.5) return 'text-gray-600';
    if (weight <= 1.0) return 'text-blue-600';
    if (weight <= 2.0) return 'text-orange-600';
    return 'text-red-600';
  },

  /**
   * Format document for display
   */
  formatDocumentTitle: (document: DocumentMetadata): string => {
    const year = document.year ? ` (${document.year})` : '';
    return `${document.title}${year}`;
  },

  /**
   * Get document summary for display
   */
  getDocumentSummary: (document: DocumentMetadata): string => {
    const authors = document.authors.length > 2 
      ? `${document.authors[0]} et al.`
      : document.authors.join(', ');
    
    const journal = document.journal || 'Unknown Journal';
    const year = document.year || 'Unknown Year';
    
    return `${authors} - ${journal} (${year})`;
  }
};