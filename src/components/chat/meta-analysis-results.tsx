/**
 * Meta-Analysis Results Component
 * Displays meta-analysis comparison results with patient data vs literature
 * Shows statistical comparisons and clinical significance
 */

'use client';

import React, { useState } from 'react';
import { BarChart, TrendingUp, TrendingDown, AlertTriangle, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MetaAnalysisResult {
  parameter: string;
  patient_value: number;
  mean_value: number;
  std_deviation: number;
  percentile: number;
  z_score: number;
  clinical_significance: 'normal' | 'borderline' | 'abnormal';
  interpretation: string;
  confidence_interval: [number, number];
  sample_size: number;
}

interface MetaAnalysisResultsProps {
  results?: MetaAnalysisResult[];
  className?: string;
}

/**
 * Individual parameter result component
 */
function ParameterResult({ result }: { result: MetaAnalysisResult }) {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'normal': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'borderline': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'abnormal': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'normal': return <TrendingUp className="w-4 h-4" />;
      case 'borderline': return <AlertTriangle className="w-4 h-4" />;
      case 'abnormal': return <TrendingDown className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number | undefined | null) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  const getPercentileText = (percentile: number) => {
    if (percentile >= 90) return 'Above 90th percentile';
    if (percentile >= 75) return '75-90th percentile';
    if (percentile >= 25) return '25-75th percentile (Normal range)';
    if (percentile >= 10) return '10-25th percentile';
    return 'Below 10th percentile';
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{result.parameter}</h4>
          <Badge 
            variant="secondary" 
            className={`text-xs ${getSignificanceColor(result.clinical_significance)}`}
          >
            <span className="flex items-center space-x-1">
              {getSignificanceIcon(result.clinical_significance)}
              <span className="capitalize">{result.clinical_significance}</span>
            </span>
          </Badge>
        </div>

        {/* Values Comparison */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Patient Value</p>
            <p className="font-semibold text-blue-600">
              {formatValue(result.patient_value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Population Mean</p>
            <p className="font-medium">
              {formatValue(result.mean_value)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Std Dev</p>
            <p className="font-medium text-gray-600">
              ±{formatValue(result.std_deviation)}
            </p>
          </div>
        </div>

        {/* Statistical Indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 rounded ${getSignificanceColor(result.clinical_significance)}`}>
              {getPercentileText(result.percentile)}
            </span>
            <Badge variant="outline" className="text-xs">
              Z-score: {formatValue(result.z_score)}
            </Badge>
          </div>
          <span className="text-gray-500">n={result.sample_size}</span>
        </div>

        {/* Confidence Interval */}
        <div className="text-xs text-gray-600">
          <span className="font-medium">95% CI:</span>
          <span className="ml-1">
            {result.confidence_interval && result.confidence_interval.length >= 2 
              ? `[${formatValue(result.confidence_interval[0])}, ${formatValue(result.confidence_interval[1])}]`
              : 'N/A'
            }
          </span>
        </div>

        {/* Clinical Interpretation */}
        <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
          {result.interpretation}
        </div>
      </div>
    </Card>
  );
}

/**
 * Summary statistics component
 */
function MetaAnalysisSummary({ results }: { results: MetaAnalysisResult[] }) {
  const normalCount = results.filter(r => r.clinical_significance === 'normal').length;
  const borderlineCount = results.filter(r => r.clinical_significance === 'borderline').length;
  const abnormalCount = results.filter(r => r.clinical_significance === 'abnormal').length;
  const totalParameters = results.length;

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Meta-Analysis Summary
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Parameters</p>
            <p className="text-lg font-bold text-blue-600">{totalParameters}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Normal</p>
            <p className="text-lg font-bold text-green-600">{normalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Borderline</p>
            <p className="text-lg font-bold text-yellow-600">{borderlineCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Abnormal</p>
            <p className="text-lg font-bold text-red-600">{abnormalCount}</p>
          </div>
        </div>

        <div className="text-xs text-blue-800 dark:text-blue-200">
          <p>
            Results compared against population data from multiple studies. 
            Statistical significance based on Z-scores and percentile rankings.
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Main meta-analysis results component
 */
export function MetaAnalysisResults({ results, className = '' }: MetaAnalysisResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!results || results.length === 0) {
    return null;
  }

  // Sort results by clinical significance (abnormal first, then borderline, then normal)
  const sortedResults = [...results].sort((a, b) => {
    const significanceOrder = { abnormal: 0, borderline: 1, normal: 2 };
    return significanceOrder[a.clinical_significance] - significanceOrder[b.clinical_significance];
  });

  const displayResults = isExpanded ? sortedResults : sortedResults.slice(0, 3);
  const hasMore = results.length > 3;

  return (
    <div className={`p-4 border-t bg-gray-50 dark:bg-gray-900/20 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Meta-Analysis Results</h3>
            <Badge variant="secondary" className="text-xs">
              {results.length} parameters
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
                  Show All ({results.length})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary */}
        <MetaAnalysisSummary results={results} />

        <Separator />

        {/* Parameter Results */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Parameter Comparisons
          </h4>
          <div className="grid gap-3">
            {displayResults.map((result, index) => (
              <ParameterResult key={`${result.parameter}-${index}`} result={result} />
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
                Show {results.length - 3} more parameters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MetaAnalysisResults;