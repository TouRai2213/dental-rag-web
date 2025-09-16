import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const REMOTE_BACKEND_URL = 'https://rag-doc.dentalbrain.app';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { query, limit = 10, user_doc_ids = [] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Prepare the request to remote backend
    const searchPayload = {
      query: query.trim(),
      limit: Math.min(limit, 50), // Cap the limit
      user_doc_ids: Array.isArray(user_doc_ids) ? user_doc_ids : []
    };

    console.log('Literature search request:', searchPayload);

    // Make request to new literature search endpoint with hybrid title/author matching
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${REMOTE_BACKEND_URL}/api/search/literature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: searchPayload.query,
        search_type: "hybrid",
        max_results: searchPayload.limit,
        include_metadata: true
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remote literature search failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Literature search failed: ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Parse and return the response
    const searchResponse = await response.json();
    console.log('Literature search response:', searchResponse);
    
    // Extract results from the response structure
    const searchResults = searchResponse.results || [];
    console.log('Literature search results:', searchResults.length, 'results');

    // Return formatted response matching the expected interface
    const formattedResponse = {
      results: searchResults,
      query: searchPayload.query,
      total_results: searchResults.length,
      search_time_ms: searchResponse.search_time_ms || 0
    };

    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('Literature search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during literature search',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  // Convert GET to POST request
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: parseInt(searchParams.get('limit') || '10'),
      user_doc_ids: []
    })
  });

  return POST(mockRequest as NextRequest);
}