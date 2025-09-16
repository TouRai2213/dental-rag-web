/**
 * Legacy hook that now uses the Context-based implementation
 * This maintains backward compatibility while using the global state
 */

import { useAddedSections as useAddedSectionsContext } from '@/contexts/added-sections-context';
import type { LiteratureReference } from '@/types/conversation';

export interface AddedSection {
  id: string;
  reference: LiteratureReference;
  addedAt: Date;
  sessionId: string; // Which session/conversation this section belongs to
}

export interface UseAddedSectionsReturn {
  addedSections: AddedSection[];
  addSection: (reference: LiteratureReference, sessionId?: string) => Promise<string>;
  removeSection: (id: string) => void;
  clearSections: (sessionId?: string) => void;
  getSectionsForSession: (sessionId: string) => AddedSection[];
  isSectionAdded: (referenceId: string, sessionId?: string) => boolean;
}

/**
 * Custom hook to manage added sections across the application
 * This now uses the Context-based implementation for global state management
 */
export function useAddedSections(): UseAddedSectionsReturn {
  return useAddedSectionsContext();
}