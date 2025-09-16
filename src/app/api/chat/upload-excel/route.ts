import { NextRequest, NextResponse } from 'next/server';
import { parseExcelPatientData, validateExcelFile } from '@/lib/excel-parser';

/**
 * Handle Excel file upload for patient data processing
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateExcelFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Parse Excel file
    const patientData = await parseExcelPatientData(file);

    return NextResponse.json({
      success: true,
      patient_data: patientData,
      message: 'Excel file processed successfully'
    });

  } catch (error) {
    console.error('Excel upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process Excel file';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}