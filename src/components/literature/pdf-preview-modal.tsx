'use client';

import React, { useState } from 'react';
import { ExternalLink, Download, Maximize2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LiteratureReference } from '@/types/conversation';

interface PdfPreviewModalProps {
  citation: LiteratureReference;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfPreviewModal({ citation, isOpen, onClose }: PdfPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate PDF URL using our proxy endpoint to bypass CORS and X-Frame-Options
  const getPdfUrl = () => {
    // Priority 1: Use doc_uid if it's valid (now contains correct format like pmid:123 or doi:...)
    if (citation.doc_uid && !citation.doc_uid.startsWith('ref_')) {
      return `/api/literature/pdf?doc_uid=${encodeURIComponent(citation.doc_uid)}`;
    }

    // Priority 2: Fallback to DOI format if doc_uid is invalid but DOI exists
    if (citation.doi) {
      const documentId = `doi:${citation.doi}`;
      return `/api/literature/pdf?doc_uid=${encodeURIComponent(documentId)}`;
    }

    // Priority 3: Fallback to PMID format if DOI unavailable but PMID exists
    if (citation.pmid) {
      const documentId = `pmid:${citation.pmid}`;
      return `/api/literature/pdf?doc_uid=${encodeURIComponent(documentId)}`;
    }

    // Priority 4: Try title-based search (extract keywords for filename matching)
    if (citation.title && citation.title !== 'Unknown') {
      // Clean title for potential filename matching
      const cleanTitle = citation.title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 50); // Limit length

      return `/api/literature/pdf?doc_uid=${encodeURIComponent(cleanTitle)}`;
    }

    // Fallback: Return empty URL to show error state
    return '';
  };

  // Open PDF in new tab
  const openInNewTab = () => {
    const url = getPdfUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Download PDF
  const downloadPdf = () => {
    const url = getPdfUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${citation.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Open PubMed if available
  const openPubMed = () => {
    if (citation.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`, '_blank', 'noopener,noreferrer');
    } else if (citation.doi) {
      window.open(`https://doi.org/${citation.doi}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="text-left pr-8">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold leading-6 truncate">
                  {citation.title}
                </h2>
                {citation.authors && (
                  <p className="text-sm text-gray-600 mt-1">
                    {Array.isArray(citation.authors) ? citation.authors.join(', ') : citation.authors}
                  </p>
                )}
                {citation.journal && citation.year && (
                  <p className="text-xs text-gray-500 mt-1">
                    {citation.journal} ({citation.year})
                  </p>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            PDF preview for research literature
          </DialogDescription>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 min-h-0 relative bg-gray-100 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview Not Available</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The PDF might not be available on the server or there was an error loading it.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={openInNewTab} variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Try Opening in New Tab
                  </Button>
                  {(citation.pmid || citation.doi) && (
                    <Button onClick={openPubMed} variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in PubMed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Use object/embed as fallback for better PDF support */}
          {getPdfUrl() ? (
            <object
              data={getPdfUrl()}
              type="application/pdf"
              className="w-full h-[60vh]"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            >
              <embed
                src={getPdfUrl()}
                type="application/pdf"
                className="w-full h-[60vh]"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
              {/* Fallback iframe */}
              <iframe
                src={getPdfUrl()}
                className="w-full h-[60vh] border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={`PDF Preview: ${citation.title}`}
                sandbox="allow-same-origin allow-scripts"
              />
            </object>
          ) : (
            <div className="w-full h-[60vh] flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Available</h3>
                <p className="text-sm text-gray-600 mb-4">
                  No valid PDF identifier found. This literature reference may not have an associated PDF file.
                </p>
                {(citation.pmid || citation.doi) && (
                  <Button onClick={openPubMed} variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in PubMed
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <Button onClick={downloadPdf} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          
          <Button onClick={openInNewTab} variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </Button>

          {/* Show PubMed button if available */}
          {(citation.pmid || citation.doi) && (
            <Button onClick={openPubMed} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              View in PubMed
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}