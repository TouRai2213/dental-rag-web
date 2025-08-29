/**
 * Unit tests for Excel Parser
 * Tests the parsing logic for Polygon worksheet format
 */

import { parseExcelPatientData, validateExcelFile, getPatientDataPreview } from '../excel-parser';
import type { PatientData } from '@/types/conversation';

// Mock XLSX library
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

import * as XLSX from 'xlsx';

describe('Excel Parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateExcelFile', () => {
    it('should validate valid Excel file types', () => {
      const xlsxFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const result = validateExcelFile(xlsxFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
      
      const result = validateExcelFile(txtFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject files that are too large', () => {
      // Create a file larger than 10MB (mock)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const result = validateExcelFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size too large');
    });
  });

  describe('parseExcelPatientData', () => {
    const mockWorkbook = {
      SheetNames: ['Polygon'],
      Sheets: {
        Polygon: {},
      },
    };

    const mockPatientData = [
      // Row 0: Patient info [date, type, name, gender, age]
      ['2024-01-15', 'CR', '小倉馨', '男性', 26],
      [], // Row 1: empty
      [], // Row 2: empty
      [], // Row 3: empty
      // Row 4+: Measurements [type, measurement_name, _, avg, std, patient_value, clinical_meaning]
      ['angle', 'ANB', '', 2.5, 1.2, 1.45, 'skeletal CI.I'],
      ['angle', 'SNA', '', 82.0, 3.0, 81.89, '正常範囲内'],
      ['distance', 'Overjet', '', 2.5, 1.0, -0.45, '反対咬合'],
      ['distance', 'Overbite', '', 2.0, 1.5, -0.11, '開咬'],
    ];

    beforeEach(() => {
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockPatientData);
    });

    it('should successfully parse valid Excel data', async () => {
      const file = new File(['mock data'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Mock FileReader
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        onload: null,
        onerror: null,
        readAsArrayBuffer: jest.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }, 0);
        }),
      }));

      const result = await parseExcelPatientData(file);

      expect(result).toEqual({
        name: '小倉馨',
        gender: 'male',
        age: 26,
        ethnicity: 'japanese',
        measurements: {
          'ANB': 1.45,
          'SNA': 81.89,
          'Overjet': -0.45,
          'Overbite': -0.11,
        },
        clinical_significance: {
          'ANB': 'skeletal CI.I',
          'SNA': '正常範囲内',
          'Overjet': '反対咬合',
          'Overbite': '開咬',
        },
      });

      global.FileReader = originalFileReader;
    });

    it('should throw error for missing Polygon worksheet', async () => {
      const mockWorkbookNoPolygon = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbookNoPolygon);

      const file = new File(['mock data'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      global.FileReader = jest.fn().mockImplementation(() => ({
        onload: null,
        onerror: null,
        readAsArrayBuffer: jest.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }, 0);
        }),
      }));

      await expect(parseExcelPatientData(file)).rejects.toThrow('Polygon worksheet not found');
    });

    it('should handle invalid gender values', async () => {
      const invalidGenderData = [
        ['2024-01-15', 'CR', '小倉馨', 'invalid', 26], // Invalid gender
        [], [], [],
        ['angle', 'ANB', '', 2.5, 1.2, 1.45, 'skeletal CI.I'],
      ];

      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(invalidGenderData);

      const file = new File(['mock data'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      global.FileReader = jest.fn().mockImplementation(() => ({
        onload: null,
        onerror: null,
        readAsArrayBuffer: jest.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }, 0);
        }),
      }));

      await expect(parseExcelPatientData(file)).rejects.toThrow('Invalid gender value');
    });
  });

  describe('getPatientDataPreview', () => {
    it('should generate correct preview for patient data', () => {
      const patientData: PatientData = {
        name: '小倉馨',
        age: 26,
        gender: 'male',
        ethnicity: 'japanese',
        measurements: {
          'ANB': 1.45,
          'SNA': 81.89,
          'SNB': 83.34,
          'FMA': 22.19,
          'IMPA': 88.33,
          'U1_to_SN': 107.62,
        },
        clinical_significance: {
          'ANB': 'skeletal CI.I',
          'SNA': '正常範囲内',
          'SNB': 'やや小さい',
        },
      };

      const preview = getPatientDataPreview(patientData);

      expect(preview.basicInfo).toBe('小倉馨, 26 years, male');
      expect(preview.measurementCount).toBe(6);
      expect(preview.sampleMeasurements).toHaveLength(5); // Only first 5
      expect(preview.sampleMeasurements[0]).toEqual({
        name: 'ANB',
        value: 1.45,
        meaning: 'skeletal CI.I',
      });
    });

    it('should handle empty patient data gracefully', () => {
      const patientData: PatientData = {};

      const preview = getPatientDataPreview(patientData);

      expect(preview.basicInfo).toBe('Unknown, Unknown years, Unknown');
      expect(preview.measurementCount).toBe(0);
      expect(preview.sampleMeasurements).toHaveLength(0);
    });
  });
});