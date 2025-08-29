/**
 * Patient Data Upload Component
 * Main component for uploading and managing patient cephalometric data
 * Combines Excel upload with manual form entry and data preview
 */

'use client';

import React, { useState } from 'react';
import { User, FileSpreadsheet, Edit3, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ExcelUpload } from './excel-upload';
import { getPatientDataPreview } from '@/lib/excel-parser';
import type { PatientData } from '@/types/conversation';

interface PatientDataUploadProps {
  // Hook props passed from parent
  patientData: PatientData | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  uploadExcelFile: (file: File) => Promise<void>;
  clearPatientData: () => void;
  updatePatientData: (data: Partial<PatientData>) => void;
  clearError: () => void;
  hasData: boolean;
  preview: ReturnType<typeof getPatientDataPreview> | null;
  
  // Optional props
  onPatientDataChange?: (data: PatientData | null) => void;
  className?: string;
}

type ViewMode = 'upload' | 'preview' | 'edit';

export function PatientDataUpload({ 
  // Hook props
  patientData,
  isLoading,
  error,
  uploadProgress,
  uploadExcelFile,
  clearPatientData,
  updatePatientData,
  clearError,
  hasData,
  preview,
  
  // Optional props
  onPatientDataChange, 
  className = '' 
}: PatientDataUploadProps) {

  const [viewMode, setViewMode] = useState<ViewMode>('upload');

  // Notify parent when patient data changes
  React.useEffect(() => {
    onPatientDataChange?.(patientData);
  }, [patientData, onPatientDataChange]);

  // Auto-switch to preview mode when data is loaded
  React.useEffect(() => {
    if (hasData && viewMode === 'upload') {
      setViewMode('preview');
    }
  }, [hasData, viewMode]);

  const handleFileUpload = async (file: File) => {
    clearError();
    await uploadExcelFile(file);
    // After successful upload, switch to preview mode
    if (hasData) {
      setViewMode('preview');
    }
  };

  const handleClearData = () => {
    clearPatientData();
    setViewMode('upload');
  };

  const renderUploadView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold mb-1">Upload Patient Data</h3>
        <p className="text-sm text-gray-600">
          Upload an Excel file with cephalometric measurements or enter data manually
        </p>
      </div>

      <ExcelUpload
        onFileSelect={handleFileUpload}
        isLoading={isLoading}
        error={error}
        progress={uploadProgress}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
            Or
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setViewMode('edit')}
      >
        <Edit3 className="h-4 w-4 mr-2" />
        Enter Data Manually
      </Button>
    </div>
  );

  const renderPreviewView = () => {
    if (!preview) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Patient Data Loaded</h3>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            {preview.measurementCount} measurements
          </Badge>
        </div>

        {/* Patient Basic Info */}
        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="space-y-2">
            <p className="font-medium text-green-800 dark:text-green-200">
              {preview.basicInfo}
            </p>
            {patientData?.ethnicity && (
              <p className="text-sm text-green-700 dark:text-green-300">
                Ethnicity: {patientData.ethnicity}
              </p>
            )}
          </div>
        </Card>

        {/* Sample Measurements */}
        <div>
          <h4 className="text-sm font-medium mb-2">Sample Measurements:</h4>
          <div className="space-y-2">
            {preview.sampleMeasurements.map((measurement, index) => (
              <div key={index} className="flex justify-between items-start text-sm">
                <span className="font-medium">{measurement.name}:</span>
                <div className="text-right">
                  <span className="text-blue-600">{measurement.value}</span>
                  {measurement.meaning && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {measurement.meaning}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {preview.measurementCount > 5 && (
              <p className="text-xs text-gray-500 italic">
                ... and {preview.measurementCount - 5} more measurements
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode('edit')}
            className="flex-1"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearData}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    );
  };

  const renderEditView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manual Entry</h3>
        {hasData && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        )}
      </div>

      {/* Basic Patient Info Form */}
      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              type="text"
              value={patientData?.name || ''}
              onChange={(e) => updatePatientData({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Patient name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Age</label>
            <input
              type="number"
              value={patientData?.age || ''}
              onChange={(e) => updatePatientData({ age: parseInt(e.target.value) || undefined })}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Age"
              min="0"
              max="150"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Gender</label>
            <select
              value={patientData?.gender || ''}
              onChange={(e) => updatePatientData({ gender: e.target.value as 'male' | 'female' | undefined })}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Measurements can be uploaded via Excel file for detailed analysis.</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setViewMode('upload')}
          className="mt-2"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Upload Excel File
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card className="p-6">
        {viewMode === 'upload' && renderUploadView()}
        {viewMode === 'preview' && renderPreviewView()}
        {viewMode === 'edit' && renderEditView()}
      </Card>
    </div>
  );
}

export default PatientDataUpload;