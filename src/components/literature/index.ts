/**
 * Literature Components Exports
 * Central export point for all literature-related components
 */

export { LiteratureSearch } from './literature-search';
export { LiteratureResults } from './literature-results';
export { LiteratureSearchContainer } from './literature-search-container';
export { LiteratureSearchDialog } from './literature-search-dialog';
export { LiteratureSearchWithSidebar } from './literature-search-with-sidebar';

// Re-export types for convenience
export type { LiteratureSearchResponse, LiteratureSearchRequest } from '@/lib/api/literature';