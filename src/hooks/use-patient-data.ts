/**
 * Patient data management hook
 * Handles Excel upload, parsing, and form state for patient cephalometric data
 */

import React, { useState, useCallback } from 'react';
import { parseExcelPatientData, validateExcelFile, getPatientDataPreview } from '@/lib/excel-parser';
import { conversationApi } from '@/lib/api/conversations';
import type { PatientData } from '@/types/conversation';

export interface UsePatientDataReturn {
  // State
  patientData: PatientData | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  
  // Actions
  uploadExcelFile: (file: File) => Promise<void>;
  clearPatientData: () => void;
  updatePatientData: (data: Partial<PatientData>) => void;
  clearError: () => void;
  
  // Computed values
  hasData: boolean;
  preview: ReturnType<typeof getPatientDataPreview> | null;
}

export function usePatientData(): UsePatientDataReturn {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload and parse Excel file with patient data
   */
  const uploadExcelFile = useCallback(async (file: File) => {
    console.log('[usePatientData] uploadExcelFile called with:', file.name);
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file first
      const validation = validateExcelFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setUploadProgress(25);

      // Parse Excel file locally
      console.log('[usePatientData] Parsing Excel file locally...');
      const parsedData = await parseExcelPatientData(file);
      console.log('[usePatientData] Parsed data:', parsedData);
      setUploadProgress(75);

      // Optional: Send to backend for processing/validation
      let finalData = parsedData;
      try {
        console.log('[usePatientData] Sending to backend...');
        const backendResponse = await conversationApi.uploadExcelPatientData(file);
        
        // Use backend response if available, otherwise use local parsing
        if (backendResponse.success && backendResponse.patient_data) {
          console.log('[usePatientData] Using backend response');
          finalData = backendResponse.patient_data;
          setPatientData(backendResponse.patient_data);
        } else {
          console.log('[usePatientData] Using local parsing (backend returned no data)');
          setPatientData(parsedData);
        }
      } catch (backendError) {
        // If backend fails, use local parsing as fallback
        console.warn('[usePatientData] Backend Excel processing failed, using local parsing:', backendError);
        setPatientData(parsedData);
      }

      setUploadProgress(100);
      console.log('[usePatientData] Patient data set successfully:', {
        parsedData,
        finalData,
        measurementCount: finalData ? Object.keys(finalData.measurements || {}).length : 0
      });
      
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process Excel file';
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear all patient data
   */
  const clearPatientData = useCallback(() => {
    setPatientData(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  /**
   * Update patient data (for manual editing)
   */
  const updatePatientData = useCallback((data: Partial<PatientData>) => {
    setPatientData(prev => prev ? { ...prev, ...data } : data as PatientData);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Debug: Track patientData state changes
  React.useEffect(() => {
    console.log('[usePatientData] patientData state changed:', {
      patientData,
      hasData: patientData !== null,
      name: patientData?.name,
      age: patientData?.age,
      measurementCount: patientData ? Object.keys(patientData.measurements || {}).length : 0
    });
  }, [patientData]);

  // Computed values
  const hasData = patientData !== null;
  const preview = patientData ? getPatientDataPreview(patientData) : null;

  return {
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
  };
}