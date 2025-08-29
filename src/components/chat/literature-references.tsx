/**
 * Literature References Component
 * Displays literature citations with modal for detailed view
 * Supports PDF downloads and DOI/PMID links
 */

'use client';

import React, { useState } from 'react';
import { BookOpen, ExternalLink, Download, Eye, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { conversationApi } from '@/lib/api/conversations';
import type { LiteratureReference, LiteratureDetailResponse } from '@/types/conversation';

interface LiteratureReferencesProps {
  references?: LiteratureReference[];
  className?: string;
}

interface ReferenceItemProps {
  reference: LiteratureReference;
  index: number;
  onViewDetail: (reference: LiteratureReference) => void;
}

interface LiteratureModalProps {
  reference: LiteratureReference | null;
  detail: LiteratureDetailResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

/**
 * Individual reference item
 */
function ReferenceItem({ reference, index, onViewDetail }: ReferenceItemProps) {
  const getRelevanceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 0.8) return 'bg-green-100 text-green-700';
    if (score >= 0.6) return 'bg-blue-100 text-blue-700';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const formatAuthors = (authors: string | undefined | null) => {
    if (!authors) return 'Unknown Authors';
    const authorList = authors.split(',').map(a => a.trim());
    if (authorList.length <= 2) return authors;
    return `${authorList[0]} et al.`;
  };

  const handlePdfDownload = () => {
    if (reference.id) {
      const pdfUrl = conversationApi.getLiteraturePdfUrl(reference.id);
      window.open(pdfUrl, '_blank');
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
            {reference.relevance_score && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRelevanceColor(reference.relevance_score)}`}
              >
                {Math.round(reference.relevance_score * 100)}% relevant
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm leading-tight line-clamp-2">
          {reference.title}
        </h4>

        {/* Authors and Journal */}
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium">{formatAuthors(reference.authors)}</span>
            {reference.year && <span className="ml-1">({reference.year})</span>}
          </p>
          <p className="italic">{reference.journal}</p>
        </div>

        {/* Excerpt */}
        {reference.excerpt && (
          <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
            <p className="line-clamp-3">{reference.excerpt}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {reference.doi && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExternalLink(`https://doi.org/${reference.doi}`)}
                className="h-6 text-xs px-2"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                DOI
              </Button>
            )}
            {reference.pmid && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExternalLink(`https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/`)}
                className="h-6 text-xs px-2"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                PMID
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(reference)}
              className="h-6 text-xs px-2"
            >
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
            {reference.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePdfDownload}
                className="h-6 text-xs px-2"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Literature detail modal
 */
function LiteratureModal({ reference, detail, isLoading, onClose }: LiteratureModalProps) {
  if (!reference) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Literature Detail</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Title */}
              <h2 className="text-lg font-semibold leading-tight">
                {detail?.title || reference.title}
              </h2>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Authors:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {detail?.authors || reference.authors}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Journal:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {detail?.journal || reference.journal}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Year:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {detail?.year || reference.year}
                  </p>
                </div>
                {reference.relevance_score && (
                  <div>
                    <p className="font-medium mb-1">Relevance Score:</p>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {Math.round(reference.relevance_score * 100)}%
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Abstract */}
              {detail?.abstract && (
                <div>
                  <h4 className="font-medium mb-2">Abstract:</h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                    <p className="whitespace-pre-wrap">{detail.abstract}</p>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {detail?.keywords && detail.keywords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Keywords:</h4>
                  <div className="flex flex-wrap gap-1">
                    {detail.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {detail?.categories && detail.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Categories:</h4>
                  <div className="flex flex-wrap gap-1">
                    {detail.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-2">
            {reference.doi && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://doi.org/${reference.doi}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                DOI
              </Button>
            )}
            {reference.pmid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}/`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                PMID
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {reference.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pdfUrl = conversationApi.getLiteraturePdfUrl(reference.id);
                  window.open(pdfUrl, '_blank');
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main literature references component
 */
export function LiteratureReferences({ references, className = '' }: LiteratureReferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedReference, setSelectedReference] = useState<LiteratureReference | null>(null);
  const [literatureDetail, setLiteratureDetail] = useState<LiteratureDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  if (!references || references.length === 0) {
    return null;
  }

  // Sort by relevance score (highest first)
  const sortedReferences = [...references].sort((a, b) => {
    const scoreA = a.relevance_score || 0;
    const scoreB = b.relevance_score || 0;
    return scoreB - scoreA;
  });

  const displayReferences = isExpanded ? sortedReferences : sortedReferences.slice(0, 3);
  const hasMore = references.length > 3;

  const handleViewDetail = async (reference: LiteratureReference) => {
    setSelectedReference(reference);
    setLiteratureDetail(null);
    setIsLoadingDetail(true);

    try {
      if (reference.id) {
        const detail = await conversationApi.getLiteratureDetail(reference.id);
        setLiteratureDetail(detail);
      }
    } catch (error) {
      console.error('Failed to load literature detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedReference(null);
    setLiteratureDetail(null);
  };

  return (
    <>
      <div className={`p-4 border-t bg-gray-50 dark:bg-gray-900/20 ${className}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Literature References</h3>
              <Badge variant="secondary" className="text-xs">
                {references.length} citations
              </Badge>
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Show All ({references.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* References Grid */}
          <div className="grid gap-3">
            {displayReferences.map((reference, index) => (
              <ReferenceItem
                key={`${reference.id || reference.title}-${index}`}
                reference={reference}
                index={index}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>

          {!isExpanded && hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-xs"
              >
                Show {references.length - 3} more references
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Literature Detail Modal */}
      <LiteratureModal
        reference={selectedReference}
        detail={literatureDetail}
        isLoading={isLoadingDetail}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default LiteratureReferences;