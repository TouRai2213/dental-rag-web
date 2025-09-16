/**
 * API route for fetching chat messages for a specific session
 * Proxies requests to local backend MySQL storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Local backend URL for conversation storage
const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8002';

/**
 * GET /api/chat/messages/[sessionId]
 * Fetch messages for a specific conversation session from local backend
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Get the authenticated user session
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    // Forward request to local backend
    const backendUrl = new URL(`/api/chat/messages/${sessionId}`, LOCAL_BACKEND_URL);
    backendUrl.searchParams.append('account_id', session.user.email);
    backendUrl.searchParams.append('skip', skip);
    backendUrl.searchParams.append('limit', limit);

    console.log('Fetching messages from backend:', backendUrl.toString());

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend is not available, return empty array
      if (response.status === 404 || response.status === 503) {
        return NextResponse.json([]);
      }
      
      throw new Error(`Backend responded with ${response.status}`);
    }

    const messages = await response.json();
    console.log('Retrieved messages from backend:', messages.length, 'messages');
    
    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    
    // Return empty array on error to maintain app functionality
    return NextResponse.json([]);
  }
}