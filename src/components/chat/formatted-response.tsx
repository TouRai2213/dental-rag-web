/**
 * Formatted Response Component
 * Formats AI responses, especially medical reports with better readability
 */

'use client';

import React from 'react';
import { InteractiveCitation } from '@/components/literature/interactive-citation';
import { LiteratureReferences } from '@/components/chat/literature-references';
import type { LiteratureReference } from '@/types/conversation';

interface FormattedResponseProps {
  content: string;
  literatureReferences?: LiteratureReference[];
  className?: string;
}

export function FormattedResponse({ content, literatureReferences = [], className = '' }: FormattedResponseProps) {


  const citationsInContent = content?.match(/\[\d+\]/g) || [];
  const uniqueCitationNumbers = [...new Set(citationsInContent.map(c => c.replace(/[\[\]]/g, '')))].sort((a, b) => parseInt(a) - parseInt(b));

  // Fallback mechanism: extract literature references from content if missing
  let effectiveLiteratureReferences = literatureReferences;
  const contentContainsCitations = /\[\d+\]/.test(content || '');
  const foundCitations = (content || '').match(/\[(\d+)\]/g) || [];
  
  // Only use fallback mechanism if NO literature references are provided
  // This prevents overriding correct doc_uid values from API responses
  if (literatureReferences.length === 0 && contentContainsCitations) {
    
    // Extract reference text patterns from content
    const referencePattern = /\[(\d+)\]\s*([^[]+?)(?=\[|$)/g;
    const extractedRefs: LiteratureReference[] = [];
    let match;
    
    // Look for reference sections in the content
    const referenceSectionMatch = content.match(/参考文献[\s\S]*$/);
    if (referenceSectionMatch) {
      const referenceSection = referenceSectionMatch[0];
      // Extract references like "[1] Title. Journal. Year."
      const refMatches = referenceSection.matchAll(/\[(\d+)\]\s*([^[]+?)(?=\[|$)/g);
      
      for (const refMatch of refMatches) {
        const citationNumber = parseInt(refMatch[1]);
        const refText = refMatch[2].trim();
        
        // Parse the reference text to extract components
        const parts = refText.split('.');
        const title = parts[0]?.trim() || 'Unknown Title';
        const journal = parts[1]?.trim() || 'Unknown Source';
        const yearMatch = refText.match(/(\d{4})/)?.[1];
        const year = yearMatch ? parseInt(yearMatch) : undefined;

        extractedRefs.push({
          id: `ref_${citationNumber}`,
          doc_uid: `ref_${citationNumber}`,
          title: title,
          authors: 'Unknown Author',
          journal: journal,
          year: year,
          document_source: 'local' as const,
          match_type: 'text',
          relevance_score: 0.8,
          content_preview: refText.substring(0, 200)
        });
      }
    }
    
    // If we found references, use them
    if (extractedRefs.length > 0) {
      effectiveLiteratureReferences = extractedRefs;
    } else {
      // Create placeholder references for citation numbers found
      const uniqueCitations = [...new Set(foundCitations.map(c => parseInt(c.replace(/[\[\]]/g, ''))))];
      effectiveLiteratureReferences = uniqueCitations.map(num => ({
        id: `ref_${num}`,
        doc_uid: `ref_${num}`,
        title: `Reference ${num} (reconstructed)`,
        authors: 'Unknown Author',
        journal: 'Unknown Source',
        year: undefined,
        document_source: 'local' as const,
        match_type: 'text',
        relevance_score: 0.5,
        content_preview: `Reference ${num} content not available`
      }));
    }
  }

  
  // Function to process inline citations in text
  const processInlineCitations = (text: string): React.ReactNode[] => {
    if (!effectiveLiteratureReferences || effectiveLiteratureReferences.length === 0) {
      return [text];
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Find all citations in format [1], [2], etc.
    const citationRegex = /\[(\d+)\]/g;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const citationNumber = parseInt(match[1]);

      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Find reference by ID
      const matchingReference = effectiveLiteratureReferences.find(ref => {
        // Strategy 1: Direct ID match
        if (ref.id === citationNumber.toString()) return true;

        // Strategy 2: Parse ID as number
        if (parseInt(ref.id) === citationNumber) return true;

        return false;
      });

      // Add interactive citation if we found a matching reference
      if (matchingReference) {
        parts.push(
          <InteractiveCitation
            key={`inline-citation-${key++}`}
            citation={matchingReference}
            citationNumber={citationNumber}  // Use original citation number
          />
        );
      } else {
        // Fallback to original format if citation not found
        parts.push(`[${citationNumber}]`);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Function to format the response content
  const formatContent = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Remove structured data comments (<!-- 结构化数据: {...} -->)
    const cleanText = text.replace(/<!--[\s\S]*?-->/g, '');

    const elements: React.ReactNode[] = [];
    let key = 0;

    // First, check if there's a references section and handle it separately
    // Look for "参考文献" at the beginning of a line
    const referenceSectionMatch = cleanText.match(/^(参考文献|References|引用文献|文献)[\s\S]*$/m);
    let mainContent = cleanText;
    let referenceContent = '';

    if (referenceSectionMatch) {
      // Find the last occurrence of the reference section header at line start
      const lines = cleanText.split('\n');
      let refLineIndex = -1;

      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().match(/^(参考文献|References|引用文献|文献)/)) {
          refLineIndex = i;
          break;
        }
      }

      if (refLineIndex !== -1) {
        mainContent = lines.slice(0, refLineIndex).join('\n');
        referenceContent = lines.slice(refLineIndex).join('\n');
      }
    }

    // Split main content by numbered sections (1), 2), 3), etc.)
    const sections = mainContent.split(/(?=^\d+\)\s)/m);

    sections.forEach((section, sectionIndex) => {
      if (!section.trim()) return;

      // Check if this is a numbered section (must be at the start of the section)
      const numberedMatch = section.match(/^(\d+\)\s)(.*)/ms);
      
      if (numberedMatch) {
        const [, numberPart, sectionContent] = numberedMatch;

        // Split content into lines and find the title
        const lines = sectionContent.trim().split('\n');
        const title = lines[0]?.trim() || '';

        // Get all remaining content as section body
        const restContent = lines.slice(1).join('\n').trim();

        
        
        elements.push(
          <div key={`section-${key++}`} className="mb-6">
            {/* Section Number and Title */}
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">{numberPart}</span>
              <span>{title}</span>
            </h3>
            
            {/* Section Content - Always show restContent even if empty */}
            <div className="ml-6 space-y-2">
              {restContent ? formatSectionContent(restContent) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  [No detailed content available]
                </div>
              )}
            </div>
          </div>
        );
      } else {
        // Handle non-numbered content (like references or conclusions)
        const formattedSection = formatSectionContent(section);
        if (formattedSection) {
          elements.push(
            <div key={`content-${key++}`} className="mb-4">
              {formattedSection}
            </div>
          );
        }
      }
    });

    // Skip rendering references section since we have LiteratureReferences component
    // if (referenceContent) {
    //   // This section is now handled by the LiteratureReferences component
    // }

    return elements;
  };

  // Function to format content within a section
  const formatSectionContent = (content: string): React.ReactNode => {
    if (!content.trim()) {
      return null;
    }

    // Preprocess content to handle multi-line references
    // Join lines that are part of the same reference (detect by continuation patterns)
    const preprocessedContent = content.replace(/\n(?!\s*[\[\d])/g, ' ');

    const lines = preprocessedContent.split('\n').filter(line => line.trim());

    const formattedLines: React.ReactNode[] = [];
    let key = 0;


    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Handle bullet points with dashes
      if (trimmedLine.startsWith('- ')) {
        const bulletContent = trimmedLine.substring(2);
        formattedLines.push(
          <div key={`bullet-${key++}`} className="mb-2 flex items-start">
            <span className="text-gray-400 mr-2 mt-1">•</span>
            <span className="text-gray-700 dark:text-gray-300">{processInlineCitations(bulletContent)}</span>
          </div>
        );
      }
      // Handle conclusion lines
      else if (trimmedLine.startsWith('結論：') || trimmedLine.startsWith('- 結論：')) {
        formattedLines.push(
          <div key={`conclusion-${key++}`} className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              {processInlineCitations(trimmedLine.replace('- ', ''))}
            </div>
          </div>
        );
      }
      // Handle reason/explanation lines
      else if (trimmedLine.startsWith('- 理由：') || trimmedLine.startsWith('理由：')) {
        formattedLines.push(
          <div key={`reason-${key++}`} className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
            <div className="text-gray-700 dark:text-gray-300">
              {processInlineCitations(trimmedLine.replace('- ', ''))}
            </div>
          </div>
        );
      }
      // Handle evidence/root cause lines  
      else if (trimmedLine.startsWith('- 根拠と解説：') || trimmedLine.startsWith('根拠と解説：')) {
        formattedLines.push(
          <div key={`evidence-${key++}`} className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <div className="text-green-700 dark:text-green-300">
              {processInlineCitations(trimmedLine.replace('- ', ''))}
            </div>
          </div>
        );
      }
      // Handle clinical points
      else if (trimmedLine.startsWith('- 臨床的要点：') || trimmedLine.startsWith('臨床的要点：')) {
        formattedLines.push(
          <div key={`clinical-${key++}`} className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
            <div className="text-yellow-700 dark:text-yellow-300">
              {processInlineCitations(trimmedLine.replace('- ', ''))}
            </div>
          </div>
        );
      }
      // Handle references section - support both [n] and plain number formats
      else if (trimmedLine.match(/^(\[\d+\]|\d+[\s\)])/)) {
        // Parse citation number from various formats: [1], 1), or just 1
        const citationMatch = trimmedLine.match(/^(?:\[(\d+)\]|(\d+)[\s\)])/);
        if (citationMatch && effectiveLiteratureReferences && effectiveLiteratureReferences.length > 0) {
          const citationNumber = parseInt(citationMatch[1] || citationMatch[2]);

          // Find citation by ID
          const citation = effectiveLiteratureReferences.find(ref => {
            // Try to match by ID
            if (ref.id === citationNumber.toString()) return true;
            if (parseInt(ref.id) === citationNumber) return true;
            return false;
          });

          if (citation) {
            // Remove the citation number prefix (handles [n], n), or just n formats)
            const restOfLine = trimmedLine.replace(/^(?:\[\d+\]|\d+[\s\)])\s*/, '').trim();

            formattedLines.push(
              <div key={`ref-${key++}`} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded mb-1">
                <div className="flex items-start gap-2">
                  <InteractiveCitation
                    citation={citation}
                    citationNumber={citationNumber}  // Use original citation number
                  />
                  <span className="flex-1 break-words">{restOfLine}</span>
                </div>
              </div>
            );
          } else {
            // Fallback to original display if citation not found
            formattedLines.push(
              <div key={`ref-${key++}`} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded mb-1">
                {trimmedLine}
              </div>
            );
          }
        } else {
          // Fallback to original display if no effective literature references
          formattedLines.push(
            <div key={`ref-${key++}`} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded mb-1">
              {trimmedLine}
            </div>
          );
        }
      }
      // Handle regular bullet points and paragraphs - IMPORTANT: Always render content
      else {
        formattedLines.push(
          <div key={`para-${key++}`} className="mb-2">
            <span className="text-gray-700 dark:text-gray-300">{processInlineCitations(trimmedLine)}</span>
          </div>
        );
      }
    });

    return <div>{formattedLines}</div>;
  };

  // Remove structured data comments first for all processing
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Check if this looks like a medical report (contains numbered sections)
  const isStructuredReport = /\d+\)\s/.test(cleanContent);

  if (isStructuredReport) {
    return (
      <div className={`formatted-response ${className}`}>
        <div className="space-y-4">
          {formatContent(content)}
        </div>

        {/* Add Literature References directly here */}
        {effectiveLiteratureReferences && effectiveLiteratureReferences.length > 0 && (
          <LiteratureReferences
            references={effectiveLiteratureReferences}
            className="mt-6"
          />
        )}
      </div>
    );
  }

  // For non-structured content, return with simple formatting
  return (
    <div className={`formatted-response ${className}`}>
      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {processInlineCitations(cleanContent)}
      </div>

      {/* Add Literature References directly here */}
      {effectiveLiteratureReferences && effectiveLiteratureReferences.length > 0 && (
        <LiteratureReferences
          references={effectiveLiteratureReferences}
          className="mt-6"
        />
      )}
    </div>
  );
}

export default FormattedResponse;