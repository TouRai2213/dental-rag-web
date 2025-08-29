# Issue #4 Implementation Plan - Frontend Integration

**Updated**: 2025-08-28T08:30:00Z  
**Status**: Ready for Implementation  
**Architecture**: Frontend Integration with Existing Backend

## Backend API Analysis

### Existing Backend Infrastructure ✅
- **Base URL**: `https://rag-doc.dentalbrain.app/`
- **Status**: Production-ready, externally accessible
- **Database**: Uses existing `t_evaluation` table structure

### Core API Endpoints (Analyzed from chat.html)
```javascript
// Primary chat endpoint
POST /api/chat/analyze
{
  message: string,
  conversation_id?: string,
  analysis_type: "comprehensive" | "osa_risk" | "orthodontic",
  include_meta_analysis: boolean,
  include_rag_search: boolean,
  patient_data?: PatientData
}

// Excel upload endpoint  
POST /api/chat/upload-excel
FormData with Excel file

// Literature endpoints
GET /api/literature/detail/{documentId}
GET /api/literature/pdf/{documentId}
```

### Response Format
```javascript
{
  conversation_id: "uuid",
  response: "AI-generated analysis report",
  meta_analysis_results: [...], // Meta-analysis comparison
  literature_references: [...] // Literature citations
}
```

## Excel Patient Data Structure (Analyzed)

### Sample File: `小倉馨_ CR    　初診_polygon.xlsx`
**Structure**: Polygon worksheet with cephalometric measurements

### Extracted Patient Data Format
```javascript
{
  name: "小倉馨",
  age: 26,
  gender: "male", // mapped from "男性"
  ethnicity: "japanese",
  measurements: {
    "ANB": 1.45,
    "SNA": 81.89,
    "SNB": 83.34,
    "FMA": 22.19,
    "IMPA(L1 to MP)": 88.33,
    "U1 to SN": 107.62,
    "Overjet": -0.45,
    "Overbite": -0.11,
    "Facial Angle": 93.4,
    "Y-axis": 58.4,
    "Nasolabial Angle": 82.2,
    "IAS(Inferior airway space)": 13.36,
    // ... 30+ additional measurements
  },
  clinical_significance: {
    "ANB": "skeletal CI.I",
    "SNA": "正常範囲内",
    "Overjet": "反対咬合",
    "Overbite": "開咬",
    "Facial Angle": "著しくオトガイ部が前突",
    // ... corresponding clinical interpretations
  }
}
```

### Key Measurements for OSA Risk Assessment
- **ANB**: 1.45° (skeletal CI.I)
- **Overjet**: -0.45mm (反対咬合 - Crossbite)
- **Overbite**: -0.11mm (開咬 - Open bite)  
- **IAS**: 13.36mm (非常に広い気道 - Very wide airway, low OSA risk)
- **T1-TT**: 74.34mm (軽度〜中等度OSAS傾向)

## Frontend Implementation Requirements

### Stream A: API Client & Environment Configuration
- Configure base URL: `https://rag-doc.dentalbrain.app/`
- Update `.env.local` with `NEXT_PUBLIC_API_URL`
- Create API client with authentication headers
- Test connectivity to existing endpoints

### Stream B: Excel Upload & Patient Data Processing
- Implement Excel file upload component
- Parse Excel structure: extract from Polygon worksheet
- Map Japanese gender terms ("男性"→"male", "女性"→"female") 
- Extract measurements from column 5 (計測値)
- Extract clinical significance from column 6 (意味)
- Auto-populate form fields after Excel processing

### Stream C: Chat Interface & Conversation Management
- Build ChatGPT-style conversation interface
- Integrate with existing `/api/chat/analyze` endpoint
- Support patient data upload and analysis
- Display meta-analysis results and literature references
- Implement conversation history using existing `t_evaluation` table

### Authentication Integration
- Map NextAuth users to `account_id` field in t_evaluation table
- Use email or user ID as account identifier
- Pass account information in API headers

## Technical Implementation Details

### File Structure
```
src/
├── components/chat/
│   ├── chat-interface.tsx      # Main chat UI
│   ├── message-list.tsx        # Message display
│   ├── message-input.tsx       # Input with Excel upload
│   └── patient-data-form.tsx   # Manual data entry
├── lib/api/
│   ├── client.ts               # API client configuration
│   └── conversations.ts        # Chat API integration
├── types/
│   └── conversation.ts         # TypeScript interfaces
└── hooks/
    └── use-conversations.ts    # React state management
```

### Excel Processing Logic
```javascript
// Extract patient data from Excel Polygon worksheet
function extractPatientData(workbook) {
  const sheet = workbook.Sheets['Polygon'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Row 0: Patient info (name, gender, age)
  // Row 4+: Measurement data with clinical significance
  return {
    name: data[0][2],
    gender: data[0][3] === '男性' ? 'male' : 'female',
    age: data[0][4],
    measurements: extractMeasurements(data),
    clinical_significance: extractClinicalMeaning(data)
  };
}
```

### Conversation Recording Strategy
- Use existing `t_evaluation` table structure
- Store conversations with `api_type='chat'`
- Group related messages by `session_id`
- Map NextAuth user to `account_id` field
- Include patient data in `request_data` field

## Success Criteria

### Stream A Complete When:
- ✅ API client connects to `https://rag-doc.dentalbrain.app/`
- ✅ Environment variables configured
- ✅ Authentication headers working
- ✅ Basic API connectivity tested

### Stream B Complete When:
- ✅ Excel upload component functional
- ✅ Patient data extraction working for Polygon format
- ✅ Clinical significance mapping implemented
- ✅ Form auto-population after Excel processing

### Stream C Complete When:
- ✅ Chat interface responsive and functional
- ✅ Integration with `/api/chat/analyze` working
- ✅ Meta-analysis results display implemented
- ✅ Literature references with modal display
- ✅ Conversation history management

## Timeline Estimate

**Parallel Execution**: 4-6 hours total  
**Sequential Would Be**: 8-10 hours  
**Efficiency Gain**: ~40% time savings through parallel development

**Ready for execution with 3 parallel streams**