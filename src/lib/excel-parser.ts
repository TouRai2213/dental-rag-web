/**
 * Excel Parser for Cephalometric Data
 * Parses Polygon worksheet format for dental X-ray measurements
 */

import * as XLSX from 'xlsx';
import type { PatientData } from '@/types/conversation';

/**
 * Interface for the raw Excel data structure
 * Based on the analyzed Polygon worksheet format
 */
interface PolygonRowData {
  [key: string]: any;
}

/**
 * Gender mapping from Japanese to English
 */
const GENDER_MAPPING = {
  '男性': 'male' as const,
  '女性': 'female' as const,
} as const;

/**
 * Parse Excel file containing cephalometric patient data
 * Expected format: Polygon worksheet with patient info and measurements
 * 
 * Structure:
 * - Row 0: Headers ["DIP Ceph", "ポリゴン表", ...]
 * - Row 1: Patient info [date, type, name, gender, age]
 * - Row 2-3: Metadata rows
 * - Row 4+: Measurements [type, measurement_name, _, avg, std, patient_value, clinical_meaning]
 */
export async function parseExcelPatientData(file: File): Promise<PatientData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file data');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        
        // Look for Polygon worksheet
        const polygonSheetName = findPolygonWorksheet(workbook);
        if (!polygonSheetName) {
          throw new Error('Polygon worksheet not found. Please ensure your Excel file contains a "Polygon" worksheet.');
        }

        const worksheet = workbook.Sheets[polygonSheetName];
        const rawData = XLSX.utils.sheet_to_json<PolygonRowData>(worksheet, { 
          header: 1, 
          defval: '' 
        });

        if (!rawData || rawData.length === 0) {
          throw new Error('Worksheet is empty or could not be parsed');
        }

        const patientData = extractPatientData(rawData);
        resolve(patientData);
        
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown error parsing Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Find the Polygon worksheet in the workbook
 * Looks for exact match or case-insensitive match
 */
function findPolygonWorksheet(workbook: XLSX.WorkBook): string | null {
  const sheetNames = workbook.SheetNames;
  
  // First try exact match
  if (sheetNames.includes('Polygon')) {
    return 'Polygon';
  }
  
  // Try case-insensitive match
  const polygonSheet = sheetNames.find(name => 
    name.toLowerCase() === 'polygon'
  );
  
  return polygonSheet || null;
}

/**
 * Extract patient data from the parsed worksheet data
 */
function extractPatientData(rawData: PolygonRowData[]): PatientData {
  if (rawData.length < 5) {
    throw new Error('Invalid Excel format: Not enough rows. Expected patient info in row 1 and measurements starting from row 4.');
  }

  // Extract patient information from row 1 (not row 0 - that's the header)
  const patientInfoRow = rawData[1];
  if (!patientInfoRow || !Array.isArray(patientInfoRow)) {
    throw new Error('Invalid Excel format: Patient information not found in row 1');
  }

  const patientInfo = extractPatientInfo(patientInfoRow);
  
  // Extract measurements starting from row 4 (skip rows 0-3 which are headers/metadata)
  const measurementRows = rawData.slice(4);
  const { measurements, clinical_significance } = extractMeasurements(measurementRows);

  return {
    ...patientInfo,
    measurements,
    clinical_significance,
    ethnicity: 'japanese', // Default assumption for Polygon format files
  };
}

/**
 * Extract patient basic information from patient info row
 * Expected format: [date, type/treatment, name, gender, age, ...]
 * Example: ["2023-06-24", "CR 初診", "小倉馨", "男性", 26, ...]
 */
function extractPatientInfo(row: any[]): Pick<PatientData, 'name' | 'gender' | 'age'> {
  if (row.length < 5) {
    throw new Error('Invalid patient info row: Expected at least 5 columns [date, type, name, gender, age]');
  }

  const name = parseStringValue(row[2], 'Patient name');
  const genderRaw = parseStringValue(row[3], ''); // Don't require gender
  const ageRaw = row[4];

  // Map gender from Japanese to English, handle empty/invalid values gracefully
  let gender: 'male' | 'female' | undefined = undefined;
  if (genderRaw) {
    gender = GENDER_MAPPING[genderRaw as keyof typeof GENDER_MAPPING];
    if (!gender && genderRaw !== '') {
      console.warn(`Unrecognized gender value: "${genderRaw}". Using undefined. Expected "男性" or "女性"`);
    }
  }

  // Parse age as number
  const age = parseNumericValue(ageRaw, 'Age');
  if (age === null || age < 0 || age > 150) {
    throw new Error(`Invalid age value: "${ageRaw}". Expected a number between 0 and 150`);
  }

  return { name, gender: gender || 'male', age }; // Default to 'male' if undefined
}

/**
 * Extract measurements and clinical significance from measurement rows
 * Expected format: [type, measurement_name, _, avg, std, patient_value, clinical_meaning]
 */
function extractMeasurements(rows: PolygonRowData[]): {
  measurements: Record<string, number>;
  clinical_significance: Record<string, string>;
} {
  const measurements: Record<string, number> = {};
  const clinical_significance: Record<string, string> = {};

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) {
      continue; // Skip invalid rows
    }

    const measurementName = parseStringValue(row[1], '');
    const patientValueRaw = row[5];
    const clinicalMeaning = parseStringValue(row[6], '');

    // Skip empty rows
    if (!measurementName || patientValueRaw === '' || patientValueRaw === undefined) {
      continue;
    }

    // Parse patient value as number
    const patientValue = parseNumericValue(patientValueRaw, '');
    if (patientValue === null) {
      continue; // Skip non-numeric values
    }

    measurements[measurementName] = patientValue;
    
    if (clinicalMeaning) {
      clinical_significance[measurementName] = clinicalMeaning;
    }
  }

  if (Object.keys(measurements).length === 0) {
    throw new Error('No valid measurements found. Please check your Excel file format.');
  }

  return { measurements, clinical_significance };
}

/**
 * Helper function to parse string values with error handling
 */
function parseStringValue(value: any, fieldName: string): string {
  if (value === null || value === undefined) {
    if (fieldName) {
      throw new Error(`${fieldName} is required but not found`);
    }
    return '';
  }
  
  return String(value).trim();
}

/**
 * Helper function to parse numeric values with error handling
 */
function parseNumericValue(value: any, fieldName: string): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle string numbers
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    if (fieldName) {
      throw new Error(`Invalid ${fieldName}: "${value}" is not a number`);
    }
    return null;
  }

  return numValue;
}

/**
 * Validate Excel file type and size
 */
export function validateExcelFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum allowed size is 10MB',
    };
  }

  return { isValid: true };
}

/**
 * Get a preview of measurements from patient data
 * Returns the first 5 measurements for display purposes
 */
export function getPatientDataPreview(patientData: PatientData): {
  basicInfo: string;
  measurementCount: number;
  sampleMeasurements: Array<{ name: string; value: number; meaning?: string }>;
} {
  const basicInfo = `${patientData.name || 'Unknown'}, ${patientData.age || 'Unknown'} years, ${patientData.gender || 'Unknown'}`;
  
  const measurementEntries = Object.entries(patientData.measurements || {});
  const measurementCount = measurementEntries.length;
  
  const sampleMeasurements = measurementEntries
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value,
      meaning: patientData.clinical_significance?.[name],
    }));

  return {
    basicInfo,
    measurementCount,
    sampleMeasurements,
  };
}