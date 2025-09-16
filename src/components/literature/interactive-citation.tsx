'use client';

import React, { useState } from 'react';
import { ExternalLink, FileText, BookOpen, Calendar, Users, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PdfPreviewModal } from './pdf-preview-modal';
import type { LiteratureReference } from '@/types/conversation';

interface InteractiveCitationProps {
  citation: LiteratureReference;
  citationNumber: number;
}

export function InteractiveCitation({ citation, citationNumber }: InteractiveCitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  
  
  // Determine if this is a local PDF or PubMed citation
  const isLocalPdf = citation.document_source === 'local';
  const isPubmedCitation = citation.document_source === 'pubmed';

  // Determine badge text based on document source
  const getBadgeText = () => {
    return isLocalPdf ? "Local PDF" : "PubMed";
  };
  
  // Format authors
  const formatAuthors = (authors: string[] | string) => {
    if (Array.isArray(authors)) {
      return authors.join(', ');
    }
    return authors;
  };

  // Generate PubMed URL
  const getPubMedUrl = () => {
    if (citation.pmid) {
      return `https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`;
    }
    if (citation.doi) {
      return `https://doi.org/${citation.doi}`;
    }
    return null;
  };

  // Open PubMed in new tab
  const openPubMed = () => {
    const url = getPubMedUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Open local PDF preview
  const openPdfPreview = () => {
    setIsOpen(false); // Close the citation details modal
    setIsPdfPreviewOpen(true); // Open the PDF preview modal
  };

  return (
    <>
      {/* Clickable citation number */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded transition-colors duration-200 cursor-pointer"
        title={`View citation: ${citation.title}`}
      >
        {citationNumber}
      </button>

      {/* Literature detail modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {isLocalPdf ? (
                  <FileText className="w-6 h-6 text-blue-600" />
                ) : (
                  <BookOpen className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-left text-lg leading-6">
                  {citation.title}
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-gray-600 mt-1">
                  {formatAuthors(citation.authors)} {citation.year && `(${citation.year})`}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={isLocalPdf ? "default" : "secondary"}>
                    {getBadgeText()}
                  </Badge>
                  {citation.relevance_score && (
                    <Badge variant="outline">
                      {(citation.relevance_score * 100).toFixed(0)}% match
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Authors */}
            {citation.authors && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Authors</p>
                  <p className="text-sm text-gray-600">{formatAuthors(citation.authors)}</p>
                </div>
              </div>
            )}

            {/* Journal and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citation.journal && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Journal</p>
                    <p className="text-sm text-gray-600">{citation.journal}</p>
                  </div>
                </div>
              )}
              
              {citation.year && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Year</p>
                    <p className="text-sm text-gray-600">{citation.year}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content preview or excerpt */}
            {(citation.content_preview || citation.excerpt) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {citation.content_preview || citation.excerpt}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* DOI and PMID info */}
            {(citation.doi || citation.pmid) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {citation.pmid && (
                    <p className="text-xs text-gray-500">PMID: {citation.pmid}</p>
                  )}
                  {citation.doi && (
                    <p className="text-xs text-gray-500">DOI: {citation.doi}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            
            {isLocalPdf ? (
              <Button onClick={openPdfPreview} className="gap-2">
                <FileText className="w-4 h-4" />
                View PDF
              </Button>
            ) : isPubmedCitation ? (
              <Button onClick={openPubMed} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in PubMed
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      {isLocalPdf && (
        <PdfPreviewModal
          citation={citation}
          isOpen={isPdfPreviewOpen}
          onClose={() => setIsPdfPreviewOpen(false)}
        />
      )}
    </>
  );
}