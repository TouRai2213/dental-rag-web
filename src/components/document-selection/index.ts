/**
 * Document Selection Components Exports
 * Central export point for all document selection components
 */

export { DocumentSelectionModal } from './document-selection-modal';
export { DocumentList } from './document-list';
export { WeightAdjustment } from './weight-adjustment';
export { IntegratedLiteratureSearch } from './integrated-literature-search';

// Re-export types and hooks for convenience
export { useDocumentSelection, documentSelectionUtils, DEFAULT_WEIGHTS } from '@/hooks/use-document-selection';
export type { 
  DocumentMetadata, 
  DocumentSelection, 
  ListDocumentsRequest,
  SearchDocumentsRequest 
} from '@/lib/api/documents';