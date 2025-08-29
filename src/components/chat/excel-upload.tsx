/**
 * Excel Upload Component
 * Drag & drop file upload for Excel patient data with visual feedback
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExcelUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  progress?: number;
  className?: string;
}

export function ExcelUpload({ 
  onFileSelect, 
  isLoading = false, 
  error = null, 
  progress = 0,
  className = '' 
}: ExcelUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're actually leaving the drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      await onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      await onFileSelect(file);
    }
  }, [onFileSelect]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  // Upload status indicator
  const getStatusIcon = () => {
    if (isLoading) {
      return <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />;
    }
    if (error) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (selectedFile && progress === 100) {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    return <Upload className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) {
      return progress > 0 ? `Processing... ${progress}%` : 'Processing...';
    }
    if (error) {
      return error;
    }
    if (selectedFile) {
      return progress === 100 ? 'Upload successful!' : selectedFile.name;
    }
    return 'Drop your Excel file here or click to browse';
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isLoading) return 'text-blue-600';
    if (selectedFile && progress === 100) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className={`w-full ${className}`}>
      <Card
        className={`
          relative p-6 border-2 border-dashed transition-colors duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
          ${isLoading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* File input */}
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {/* Content */}
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Icon */}
          <div className="flex items-center justify-center">
            {selectedFile ? (
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
            ) : (
              getStatusIcon()
            )}
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            
            {!selectedFile && !error && (
              <p className="text-sm text-gray-500 mt-1">
                Supports .xlsx and .xls files (max 10MB)
              </p>
            )}
          </div>

          {/* Progress bar */}
          {isLoading && progress > 0 && (
            <div className="w-full max-w-xs">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* File info and actions */}
          {selectedFile && !isLoading && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="w-full">
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded border">
                {error}
              </p>
            </div>
          )}

          {/* Browse button */}
          {!selectedFile && !isLoading && (
            <Button variant="outline" size="sm" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          )}
        </div>
      </Card>

      {/* Format hint */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-2">
          <FileSpreadsheet className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Expected Format: Polygon Worksheet
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Excel file should contain a "Polygon" worksheet with patient info in row 0 and measurements starting from row 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExcelUpload;