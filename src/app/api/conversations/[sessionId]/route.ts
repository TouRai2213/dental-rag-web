/**
 * Dynamic API route for specific conversation operations
 * Handles GET and DELETE for individual conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/conversations/[sessionId]
 * Fetch a specific conversation with all messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    // Fetch messages for this conversation from local backend
    const response = await fetch(
      `${LOCAL_BACKEND_URL}/api/chat/messages/${sessionId}?account_id=${encodeURIComponent(session.user.email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with ${response.status}`);
    }

    const messages = await response.json();

    // Process messages to restore literature references from response_data
    const processedMessages = (messages || []).map((message: any) => {
      let enhancedMessage = { ...message };

      // Parse response_data to restore literature references and other metadata
      if (message.response_data) {
        try {
          const responseData = JSON.parse(message.response_data);
          if (responseData.literature_references) {
            enhancedMessage.literature_references = responseData.literature_references;
          }
          if (responseData.meta_analysis_results) {
            enhancedMessage.meta_analysis_results = responseData.meta_analysis_results;
          }
          if (responseData.evidence_data) {
            enhancedMessage.evidence_data = responseData.evidence_data;
          }
          if (responseData.citations) {
            enhancedMessage.citations = responseData.citations;
          }
        } catch (error) {
          console.warn('Failed to parse response_data for message', message.id, error);
        }
      }

      return enhancedMessage;
    });

    // Format as conversation object
    const conversation = {
      session_id: sessionId,
      account_id: session.user.email,
      messages: processedMessages,
      created_at: processedMessages[0]?.created_at || new Date().toISOString(),
      updated_at: processedMessages[processedMessages.length - 1]?.created_at || new Date().toISOString(),
    };

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[sessionId]
 * Delete a conversation (all messages with same session_id)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    console.log(`Delete request for conversation ${sessionId} by ${session.user.email}`);
    
    // Call backend to delete the conversation (all messages with this session_id)
    const response = await fetch(
      `${LOCAL_BACKEND_URL}/api/chat/messages/${sessionId}?account_id=${encodeURIComponent(session.user.email)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Conversation already doesn't exist, return success
        return NextResponse.json({
          success: true,
          message: 'Conversation already deleted',
        });
      }
      throw new Error(`Backend responded with ${response.status}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}