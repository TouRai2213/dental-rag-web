/**
 * API route for conversation management
 * Proxies requests to local backend MySQL storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Local backend URL for conversation storage
const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8002';

/**
 * GET /api/conversations
 * Fetch user's conversation list from local backend
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Forward request to local backend
    const backendUrl = new URL('/api/conversations', LOCAL_BACKEND_URL);
    backendUrl.searchParams.append('account_id', session.user.email);
    backendUrl.searchParams.append('page_size', limit);
    backendUrl.searchParams.append('page', String(Math.floor(Number(offset) / Number(limit)) + 1));

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend is not available, return empty list
      if (response.status === 404 || response.status === 503) {
        return NextResponse.json({
          conversations: [],
          total: 0,
        });
      }
      
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Transform backend response to match frontend expectations
    // Add id field for compatibility with EnhancedConversationSummary
    const transformedConversations = (data.conversations || []).map((conv: any) => ({
      ...conv,
      id: conv.session_id, // Map session_id to id for frontend compatibility
    }));
    
    return NextResponse.json({
      conversations: transformedConversations,
      total: data.total_count || data.total || 0,
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    
    // Return empty list on error to maintain app functionality
    return NextResponse.json({
      conversations: [],
      total: 0,
    });
  }
}

/**
 * POST /api/conversations
 * Create a new conversation record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Forward to local backend
    const response = await fetch(`${LOCAL_BACKEND_URL}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        account_id: session.user.email,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}