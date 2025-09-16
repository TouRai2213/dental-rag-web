/**
 * API Client configuration for backend communication
 * Handles authentication, error handling, and base HTTP operations
 */

import { getSession } from 'next-auth/react';

/**
 * Global session cache to prevent excessive polling
 */
let globalSessionCache: { session: any, expires: number } | null = null;

/**
 * Get cached session with longer cache duration to reduce polling
 */
async function getCachedSession(): Promise<any> {
  const now = Date.now();
  
  // Use cached session if available and not expired (15 minute cache)
  if (globalSessionCache && now < globalSessionCache.expires) {
    return globalSessionCache.session;
  }
  
  // Fetch new session and cache it
  const session = await getSession();
  globalSessionCache = {
    session,
    expires: now + 900000, // 15 minutes
  };
  
  return session;
}

/**
 * API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

/**
 * Standard API error response format
 */
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  field?: string;
}

/**
 * Custom error class for API responses
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly field?: string;

  constructor(error: ApiError) {
    // Ensure message is always a string
    const message = typeof error.message === 'string' 
      ? error.message 
      : JSON.stringify(error.message);
    super(message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.code = error.code;
    this.field = error.field;
  }
}

/**
 * HTTP methods supported by the API client
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request options for API calls
 */
interface RequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

/**
 * Base API client class with authentication and error handling
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers from cached session
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getCachedSession();
    const headers: Record<string, string> = {};

    if (session?.user?.email) {
      // Use email as account_id for now - this maps to the t_evaluation.account_id field
      headers['X-Account-ID'] = session.user.email;
    }

    return headers;
  }

  /**
   * Build full URL from endpoint path
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let responseData: any;
    try {
      responseData = isJson ? await response.json() : await response.text();
    } catch (parseError) {
      responseData = null;
    }

    if (!response.ok) {
      // Extract error message from response data
      let errorMessage: string;
      if (typeof responseData?.message === 'string') {
        errorMessage = responseData.message;
      } else if (typeof responseData?.error === 'string') {
        errorMessage = responseData.error;
      } else if (typeof responseData?.detail === 'string') {
        errorMessage = responseData.detail;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData) {
        errorMessage = JSON.stringify(responseData);
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      const error: ApiError = {
        message: errorMessage,
        code: responseData?.code,
        status: response.status,
        field: responseData?.field,
      };
      throw new ApiClientError(error);
    }

    return responseData;
  }

  /**
   * Make HTTP request to API endpoint
   */
  public async request<T>(endpoint: string, options: RequestOptions = { method: 'GET' }): Promise<T> {
    const url = this.buildUrl(endpoint);
    const { method, body, requireAuth = true } = options;

    // Build headers
    const headers: Record<string, string> = {
      ...options.headers,
    };

    // Only set Content-Type for non-FormData bodies
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication headers if required
    if (requireAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    // Prepare request configuration
    const requestConfig: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        requestConfig.body = body;
      } else {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, requestConfig);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiClientError({
        message: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      });
    }
  }

  /**
   * Convenience methods for common HTTP operations
   */
  public async get<T>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  public async post<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  public async put<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  public async patch<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }

  public async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  /**
   * Get current account ID from cached session
   */
  public async getAccountId(): Promise<string | null> {
    const session = await getCachedSession();
    return session?.user?.email || null;
  }

  /**
   * Clear global session cache (useful for logout or session changes)
   */
  public clearSessionCache(): void {
    globalSessionCache = null;
  }
}

// Export singleton instance for remote API calls
export const apiClient = new ApiClient();

// Export local client instance for Next.js API routes (conversation management)
// Use a fixed URL to avoid window object issues and infinite loops
export const localApiClient = new ApiClient('http://localhost:3000');

// Export class for testing or custom instances
export { ApiClient };