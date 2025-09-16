/**
 * Global chat message search API route
 * Searches across all user's conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8002';

/**
 * GET /api/chat/search
 * Search messages across all conversations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '50';

    if (!query) {
      return NextResponse.json({
        results: [],
        total_count: 0,
        query: ''
      });
    }

    // Call backend search API
    const params = new URLSearchParams({
      account_id: session.user.email,
      query: query,
      limit: limit
    });

    const response = await fetch(
      `${LOCAL_BACKEND_URL}/api/chat/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const searchResults = await response.json();
    
    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}