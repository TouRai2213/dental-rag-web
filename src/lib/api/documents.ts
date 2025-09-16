/**
 * Documents API Client
 * Handles communication with document management endpoints
 */

import { apiClient } from './client';

/**
 * Document metadata interface
 * Represents documents available in the vector database
 */
export interface DocumentMetadata {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  abstract?: string;
  categories?: string[];
  keywords?: string[];
  document_type: 'research_paper' | 'clinical_study' | 'review' | 'case_report' | 'guidelines';
  language: 'en' | 'ja' | 'mixed';
  indexed_date: string;
  file_path?: string;
}

/**
 * Document selection with weight for boost priority
 */
export interface DocumentSelection {
  document_id: string;
  weight: number; // 1.0 = normal, 2.0 = high priority, 0.5 = low priority
  selected: boolean;
}

/**
 * Request interface for listing documents
 */
export interface ListDocumentsRequest {
  search?: string;
  category?: string;
  document_type?: DocumentMetadata['document_type'];
  language?: DocumentMetadata['language'];
  limit?: number;
  offset?: number;
}

/**
 * Response interface for document listing
 */
export interface ListDocumentsResponse {
  documents: DocumentMetadata[];
  total: number;
  has_more: boolean;
}

/**
 * Request interface for document search
 */
export interface SearchDocumentsRequest {
  query: string;
  limit?: number;
  filters?: {
    document_type?: DocumentMetadata['document_type'];
    language?: DocumentMetadata['language'];
    year_range?: [number, number];
  };
}

/**
 * Response interface for document search
 */
export interface SearchDocumentsResponse {
  documents: DocumentMetadata[];
  query: string;
  total_results: number;
  search_time_ms: number;
}

/**
 * Documents API client class
 */
class DocumentsApiClient {
  /**
   * Get list of available documents for selection
   * 
   * @param request List parameters
   * @returns Promise<ListDocumentsResponse>
   */
  async listDocuments(request: ListDocumentsRequest = {}): Promise<ListDocumentsResponse> {
    // Since there's no backend endpoint yet, we'll create mock data
    // In a real implementation, this would call an actual endpoint
    const mockDocuments: DocumentMetadata[] = [
      {
        id: 'doc_001',
        title: 'Cephalometric Analysis in Orthodontic Treatment Planning',
        authors: ['Smith, J.A.', 'Johnson, B.C.'],
        journal: 'American Journal of Orthodontics',
        year: 2023,
        doi: '10.1016/j.ajodo.2023.001',
        pmid: '37123456',
        abstract: 'A comprehensive review of modern cephalometric analysis techniques...',
        categories: ['orthodontics', 'cephalometry'],
        keywords: ['cephalometric', 'orthodontic', 'analysis', 'treatment planning'],
        document_type: 'research_paper',
        language: 'en',
        indexed_date: '2023-06-15T10:30:00Z'
      },
      {
        id: 'doc_002',
        title: '頭部X線規格写真における上顎前突の診断基準',
        authors: ['田中太郎', '佐藤花子'],
        journal: '日本矯正歯科学会雑誌',
        year: 2023,
        abstract: '上顎前突の診断における頭部X線規格写真の有用性について...',
        categories: ['orthodontics', 'diagnosis'],
        keywords: ['頭部X線規格写真', '上顎前突', '診断'],
        document_type: 'clinical_study',
        language: 'ja',
        indexed_date: '2023-07-20T14:15:00Z'
      },
      {
        id: 'doc_003',
        title: 'Digital Cephalometric Analysis: A Modern Approach',
        authors: ['Wilson, M.K.', 'Brown, L.P.', 'Davis, R.Q.'],
        journal: 'Journal of Digital Dentistry',
        year: 2024,
        doi: '10.1111/jdd.2024.001',
        abstract: 'Digital analysis methods for cephalometric measurements...',
        categories: ['digital dentistry', 'cephalometry'],
        keywords: ['digital', 'cephalometric', 'analysis', 'AI'],
        document_type: 'review',
        language: 'en',
        indexed_date: '2024-02-10T09:45:00Z'
      },
      {
        id: 'doc_004',
        title: 'OSA Risk Assessment Using Cephalometric Parameters',
        authors: ['Thompson, A.B.', 'Lee, C.D.'],
        journal: 'Sleep Medicine Reviews',
        year: 2023,
        doi: '10.1016/j.smrv.2023.002',
        pmid: '37234567',
        abstract: 'Evaluation of obstructive sleep apnea risk using cephalometric analysis...',
        categories: ['sleep medicine', 'cephalometry'],
        keywords: ['OSA', 'obstructive sleep apnea', 'cephalometric', 'risk assessment'],
        document_type: 'research_paper',
        language: 'en',
        indexed_date: '2023-08-05T16:20:00Z'
      },
      {
        id: 'doc_005',
        title: '小児における頭蓋顔面形態の成長パターン',
        authors: ['山田一郎', '鈴木二郎'],
        journal: '小児歯科学雑誌',
        year: 2024,
        abstract: '小児期における頭蓋顔面の成長パターンとその変化について...',
        categories: ['pediatric dentistry', 'growth'],
        keywords: ['小児', '頭蓋顔面', '成長パターン', '発育'],
        document_type: 'clinical_study',
        language: 'ja',
        indexed_date: '2024-01-18T11:30:00Z'
      }
    ];

    // Apply basic filtering
    let filteredDocuments = mockDocuments;
    
    if (request.search) {
      const searchLower = request.search.toLowerCase();
      filteredDocuments = mockDocuments.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.authors.some(author => author.toLowerCase().includes(searchLower)) ||
        doc.abstract?.toLowerCase().includes(searchLower) ||
        doc.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    if (request.document_type) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.document_type === request.document_type
      );
    }

    if (request.language) {
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.language === request.language
      );
    }

    // Apply pagination
    const limit = request.limit || 10;
    const offset = request.offset || 0;
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    return {
      documents: paginatedDocuments,
      total: filteredDocuments.length,
      has_more: filteredDocuments.length > offset + limit
    };
  }

  /**
   * Search documents by query
   * 
   * @param request Search parameters
   * @returns Promise<SearchDocumentsResponse>
   */
  async searchDocuments(request: SearchDocumentsRequest): Promise<SearchDocumentsResponse> {
    const startTime = Date.now();

    // Use the same mock data as listDocuments for now
    const listRequest: ListDocumentsRequest = {
      search: request.query,
      limit: request.limit,
      document_type: request.filters?.document_type,
      language: request.filters?.language
    };

    const listResponse = await this.listDocuments(listRequest);

    // Apply year range filter if specified
    let documents = listResponse.documents;
    if (request.filters?.year_range) {
      const [minYear, maxYear] = request.filters.year_range;
      documents = documents.filter(doc => 
        doc.year && doc.year >= minYear && doc.year <= maxYear
      );
    }

    const searchTime = Date.now() - startTime;

    return {
      documents,
      query: request.query,
      total_results: documents.length,
      search_time_ms: searchTime
    };
  }

  /**
   * Get document details by ID
   * 
   * @param documentId Document identifier
   * @returns Promise<DocumentMetadata>
   */
  async getDocument(documentId: string): Promise<DocumentMetadata> {
    // Get all documents and find the matching one
    const allDocuments = await this.listDocuments({ limit: 100 });
    const document = allDocuments.documents.find(doc => doc.id === documentId);
    
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    
    return document;
  }

  /**
   * Get documents by their IDs (used for weight boosting)
   * 
   * @param documentIds Array of document IDs
   * @returns Promise<DocumentMetadata[]>
   */
  async getDocuments(documentIds: string[]): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    for (const id of documentIds) {
      try {
        const doc = await this.getDocument(id);
        documents.push(doc);
      } catch (error) {
        // Skip missing documents but log the error
        console.warn(`Document not found: ${id}`, error);
      }
    }
    
    return documents;
  }
}

// Export singleton instance
export const documentsApi = new DocumentsApiClient();

// Export class for testing
export { DocumentsApiClient };