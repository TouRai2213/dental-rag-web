/**
 * Debug endpoint to inspect literature reference data structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8000';

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
    const sessionId = searchParams.get('session_id') || 'e0345b12-fa9b-4b77-86ea-d2e9775eb56a';

    // Fetch messages from backend
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
      throw new Error(`Backend responded with ${response.status}`);
    }

    const messages = await response.json();

    // Process and analyze the data
    const debug_info = {
      total_messages: messages.length,
      messages_with_response_data: 0,
      literature_references: [],
      raw_response_data_samples: []
    };

    for (const message of messages) {
      if (message.response_data) {
        debug_info.messages_with_response_data++;

        try {
          const responseData = JSON.parse(message.response_data);

          if (responseData.literature_references) {
            debug_info.literature_references.push(...responseData.literature_references);
          }

          // Keep first 2 raw samples for inspection
          if (debug_info.raw_response_data_samples.length < 2) {
            debug_info.raw_response_data_samples.push({
              message_id: message.id,
              response_data: responseData
            });
          }
        } catch (error) {
          console.warn('Failed to parse response_data for message', message.id, error);
        }
      }
    }

    return NextResponse.json({
      debug_info,
      session_id: sessionId,
      account_id: session.user.email
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to debug literature data' },
      { status: 500 }
    );
  }
}