# RAG API Endpoints Documentation

This document describes the available API endpoints for the Dental RAG (Retrieval-Augmented Generation) system integration.

## Backend URL
**Production Backend**: https://rag-doc.dentalbrain.app

## API Client Usage

```typescript
import { conversationApi } from '@/lib/api/conversations';

// The API client is pre-configured and ready to use
// Authentication is handled automatically via NextAuth session
```

## Available Endpoints

### 1. Chat Analysis - POST /api/chat/analyze

**Purpose**: Main endpoint for dental cephalometric analysis using RAG system

**Frontend Method**: 
```typescript
const response = await conversationApi.analyzeWithRag({
  message: "Please analyze this patient's cephalometric data",
  conversation_id: "optional-existing-conversation-id",
  analysis_type: "comprehensive", // or "osa_risk" | "orthodontic"
  include_meta_analysis: true,
  include_rag_search: true,
  patient_data: {
    name: "Patient Name",
    age: 26,
    gender: "male",
    measurements: {
      "ANB": 1.45,
      "SNA": 81.89,
      // ... other measurements
    },
    clinical_significance: {
      "ANB": "skeletal CI.I",
      // ... other interpretations
    }
  }
});
```

**Response**:
```typescript
{
  conversation_id: "uuid",
  response: "AI-generated analysis report",
  meta_analysis_results: [...], // Optional meta-analysis data
  literature_references: [...] // Optional literature citations
}
```

### 2. Excel Upload - POST /api/chat/upload-excel

**Purpose**: Upload Excel file with patient cephalometric data (Polygon worksheet format)

**Frontend Method**:
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const response = await conversationApi.uploadExcelPatientData(file);
```

**Response**:
```typescript
{
  success: true,
  patient_data: PatientData,
  message: "Patient data extracted successfully"
}
```

**Excel Format Expected**:
- Worksheet name: "Polygon"  
- Row 0: Patient info (name, gender, age)
- Row 4+: Measurement data with clinical significance
- Column 5: Measurement values (計測値)
- Column 6: Clinical meanings (意味)

### 3. Literature Detail - GET /api/literature/detail/{documentId}

**Purpose**: Get detailed information about a literature reference

**Frontend Method**:
```typescript
const detail = await conversationApi.getLiteratureDetail("document-id-123");
```

**Response**:
```typescript
{
  id: "document-id-123",
  title: "Article Title",
  authors: "Author1, Author2",
  journal: "Journal Name",
  year: 2023,
  abstract: "Article abstract...",
  doi: "10.1234/example",
  pmid: "12345678",
  keywords: ["keyword1", "keyword2"],
  categories: ["category1", "category2"]
}
```

### 4. Literature PDF - GET /api/literature/pdf/{documentId}

**Purpose**: Download PDF of literature reference

**Frontend Method**:
```typescript
// Get download URL
const pdfUrl = conversationApi.getLiteraturePdfUrl("document-id-123");

// Use URL for download link or iframe
<a href={pdfUrl} target="_blank" download>Download PDF</a>
```

## Convenience Methods

### Complete Patient Analysis Workflow
```typescript
// Upload Excel file and analyze in one workflow
const file = selectedExcelFile;
const uploadResult = await conversationApi.uploadExcelPatientData(file);

if (uploadResult.success) {
  const analysisResult = await conversationApi.analyzePatientData(
    "Please provide a comprehensive analysis of this patient",
    uploadResult.patient_data,
    "comprehensive"
  );
}
```

## Authentication

All API calls automatically include authentication headers:
- **X-Account-ID**: User's email from NextAuth session
- Handled automatically by the API client
- No additional authentication required

## Error Handling

```typescript
try {
  const result = await conversationApi.analyzeWithRag(request);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log('API Error:', error.message);
    console.log('Status:', error.status);
    console.log('Code:', error.code);
  }
}
```

## CORS Support

- Backend supports CORS for localhost:3001
- All endpoints include: `access-control-allow-origin: *`
- Frontend can make direct API calls without proxy

## Example: Complete RAG Chat Implementation

```typescript
import { useState } from 'react';
import { conversationApi } from '@/lib/api/conversations';

function ChatInterface() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const response = await conversationApi.analyzeWithRag({
        message,
        conversation_id: conversation?.conversation_id,
        analysis_type: 'comprehensive',
        include_meta_analysis: true,
        include_rag_search: true,
      });
      
      // Update conversation state
      setConversation(prev => ({
        ...prev,
        conversation_id: response.conversation_id,
        messages: [
          ...(prev?.messages || []),
          { user_message: message, ai_response: response.response }
        ]
      }));
      
      setMessage('');
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your chat UI here
  );
}
```

This integration provides a complete interface to the production RAG backend for dental cephalometric analysis.