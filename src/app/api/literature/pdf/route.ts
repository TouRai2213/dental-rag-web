/**
 * API route to proxy PDF requests from the literature server
 * This bypasses CORS and X-Frame-Options restrictions
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source');
    const docUid = searchParams.get('doc_uid');

    if (!source && !docUid) {
      return NextResponse.json(
        { error: 'Missing source or doc_uid parameter' },
        { status: 400 }
      );
    }

    console.log('PDF request params:', { source, docUid });

    // Construct the server URL
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rag-doc.dentalbrain.app';
    let pdfUrl: string;

    if (source) {
      // Handle special cases for document source
      if (source === 'local') {
        // For local documents, try using doc_uid if available
        if (docUid) {
          pdfUrl = `${serverUrl}/api/literature/pdf/${encodeURIComponent(docUid)}`;
        } else {
          return NextResponse.json(
            { error: 'Local document source requires doc_uid' },
            { status: 400 }
          );
        }
      } else {
        // Extract just the filename if it's a full path
        const filename = source.split('/').pop() || source;
        pdfUrl = `${serverUrl}/api/literature/pdf-by-source/${encodeURIComponent(filename)}`;
      }
    } else if (docUid) {
      // Handle different document ID formats
      if (docUid.startsWith('doi:') || docUid.startsWith('pmid:') || docUid.includes('_chunk_')) {
        // Use the document ID as-is for literature preview API
        pdfUrl = `${serverUrl}/api/literature/pdf/${encodeURIComponent(docUid)}`;
      } else {
        // For simple IDs, try both direct access and by-source
        pdfUrl = `${serverUrl}/api/literature/pdf/${encodeURIComponent(docUid)}`;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    console.log('Fetching PDF from:', pdfUrl);

    // Fetch the PDF from the server
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      console.error('PDF fetch failed:', response.status, response.statusText);

      // Try alternative endpoint if the first one fails
      if (source && response.status === 404) {
        // Try with the document ID endpoint
        const altUrl = `${serverUrl}/api/literature/pdf/${encodeURIComponent(source)}`;
        console.log('Trying alternative URL:', altUrl);

        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        });

        if (altResponse.ok) {
          const pdfBuffer = await altResponse.arrayBuffer();

          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }

      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the PDF content
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF request' },
      { status: 500 }
    );
  }
}