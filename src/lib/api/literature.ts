/**
 * Literature Search API Client
 * Handles communication with the literature search endpoints
 */

import { localApiClient } from './client';
import type { LiteratureReference } from '@/types/conversation';

/**
 * Literature search request interface
 */
export interface LiteratureSearchRequest {
  query: string;
  limit?: number;
  user_doc_ids?: string[];
}

/**
 * Literature search response interface
 */
export interface LiteratureSearchResponse {
  results: LiteratureReference[];
  query: string;
  total_results: number;
  search_time_ms: number;
}

/**
 * Literature API client
 */
class LiteratureApiClient {
  /**
   * Search literature using hybrid search (vector DB + PubMed)
   * 
   * @param request Search parameters
   * @returns Promise<LiteratureSearchResponse>
   */
  async searchLiterature(request: LiteratureSearchRequest): Promise<LiteratureSearchResponse> {
    const response = await localApiClient.post<LiteratureSearchResponse>(
      'api/literature/search',
      request
    );
    
    return response;
  }

  /**
   * Search with simplified parameters
   * 
   * @param query Search query string
   * @param options Additional search options
   * @returns Promise<LiteratureSearchResponse>
   */
  async search(
    query: string, 
    options: { limit?: number; userDocIds?: string[] } = {}
  ): Promise<LiteratureSearchResponse> {
    return this.searchLiterature({
      query,
      limit: options.limit || 10,
      user_doc_ids: options.userDocIds
    });
  }

  /**
   * Get literature detail by ID
   * Note: This might be used later for detailed views
   * Currently using existing conversationApi.getLiteratureDetail
   */
  async getLiteratureDetail(id: string) {
    return localApiClient.get(`api/literature/detail/${id}`);
  }
}

// Export singleton instance
export const literatureApi = new LiteratureApiClient();

// Export class for testing
export { LiteratureApiClient };