---
name: rag-web
status: backlog
created: 2025-08-28T05:28:44Z
progress: 0%
prd: .claude/prds/rag-web.md
github: https://github.com/TouRai2213/dental-rag-web/issues/1
---

# Epic: rag-web

## Overview
Implement a production-ready web interface for the Dental RAG system that provides ChatGPT-like conversation management with specialized dental analysis capabilities. The solution will leverage existing backend infrastructure (FastAPI, Chroma DB, PostgreSQL) while introducing a modern Next.js frontend with persistent conversation history, patient data analysis, and evidence-based RAG responses.

## Architecture Decisions

### Core Technology Stack
- **Next.js 14+ with App Router** - Production-ready React framework with excellent performance and SEO
- **TypeScript** - Type safety across the entire application
- **Tailwind CSS + shadcn/ui** - Rapid UI development with consistent, accessible components
- **TanStack Query** - Efficient server state management with caching
- **Zustand** - Lightweight client state for conversations and UI state

### Key Architectural Choices
1. **Reuse Existing Infrastructure** - Leverage current FastAPI backend, extend APIs minimally
2. **Server-Sent Events (SSE)** - For message streaming instead of WebSockets (simpler, HTTP/2 compatible)
3. **PostgreSQL for Conversations** - Use existing database, add conversation tables
4. **Static Export + API Routes** - Deploy frontend statically, keep backend separate
5. **Progressive Enhancement** - Core features work without JavaScript, enhanced with React

### Simplification Strategy
- Use existing test interfaces as reference implementation
- Adapt current API endpoints instead of complete rewrite
- Leverage shadcn/ui templates for rapid UI development
- Start with essential features, add complexity gradually

## Technical Approach

### Frontend Components

#### Core UI Structure
```
app/
├── (auth)/
│   ├── login/
│   └── layout.tsx
├── (main)/
│   ├── chat/
│   │   ├── [conversationId]/
│   │   └── new/
│   ├── documents/
│   └── admin/
└── api/
    └── [...proxy]/     # Proxy to FastAPI backend
```

#### Essential Components
1. **ChatInterface** - Main conversation view with streaming messages
2. **ConversationSidebar** - History list with search and filtering
3. **PatientDataPanel** - Collapsible panel for data input
4. **DocumentSelector** - Modal for marking reference documents
5. **MessageComponent** - Renders markdown, citations, charts

### Backend Services

#### API Extension Strategy
Extend existing FastAPI endpoints rather than creating new ones:

1. **Conversation Endpoints** (New)
   - `/api/conversations/*` - CRUD operations
   - Store in PostgreSQL with simple schema

2. **Enhanced Chat Endpoint** (Modify existing)
   - Add `conversation_id` parameter to existing `/api/chat/analyze`
   - Return message with citations metadata

3. **Reuse Existing** (No changes)
   - Document search endpoints
   - Patient data upload
   - Meta-analysis endpoints

#### Database Schema (Minimal)
```sql
-- Only 3 new tables needed
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255), -- Simple email-based for MVP
  title VARCHAR(255),
  created_at TIMESTAMP,
  metadata JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20),
  content TEXT,
  created_at TIMESTAMP,
  metadata JSONB
);

CREATE TABLE marked_documents (
  conversation_id UUID,
  document_id VARCHAR(255),
  weight FLOAT DEFAULT 2.0
);
```

### Infrastructure

#### Deployment Approach
1. **Frontend**: Vercel or static hosting (Nginx)
2. **Backend**: Existing FastAPI on current server
3. **Database**: Existing PostgreSQL instance
4. **No new infrastructure required**

#### Monitoring
- Use existing logging infrastructure
- Add simple analytics with PostHog or Plausible
- Browser error tracking with Sentry (free tier)

## Implementation Strategy

### Development Phases
1. **MVP Chat Interface** - Basic conversation with existing APIs
2. **Persistence Layer** - Add conversation history
3. **Patient Analysis** - Integrate existing analysis features
4. **Document Weighting** - Session-level document selection
5. **Polish** - Error handling, performance, UI refinement

### Risk Mitigation
- Start with read-only features to avoid data corruption
- Implement graceful fallbacks for all external APIs
- Use optimistic UI updates with rollback on failure
- Cache aggressively to reduce backend load

### Testing Approach
- Unit tests for critical business logic only
- E2E tests for main user journeys
- Manual testing for edge cases
- Reuse test data from existing interfaces

## Task Breakdown Preview

High-level task categories (keeping it under 10 tasks):

- [ ] **Task 1: Project Setup** - Initialize Next.js with TypeScript, Tailwind, shadcn/ui
- [ ] **Task 2: Authentication Flow** - Simple email/password auth with session management
- [ ] **Task 3: Core Chat UI** - ChatGPT-like interface with message streaming
- [ ] **Task 4: Conversation Persistence** - Database schema and CRUD operations
- [ ] **Task 5: RAG Integration** - Connect to existing search/analysis endpoints
- [ ] **Task 6: Patient Data Module** - Upload interface and analysis workflow
- [ ] **Task 7: Document Selection** - Search modal and session weighting
- [ ] **Task 8: Export & Reports** - PDF generation and conversation export
- [ ] **Task 9: Admin Dashboard** - Basic user management and analytics
- [ ] **Task 10: Deployment & Documentation** - Production setup and user guides

## Dependencies

### External Service Dependencies
- Existing FastAPI backend (must be running)
- PostgreSQL database (existing instance)
- Chroma vector database (existing)
- LLM API (OpenAI/Anthropic - existing keys)

### Internal Prerequisites
- Access to existing codebase for reference
- Database credentials and schema
- API documentation or ability to inspect endpoints
- Sample patient data for testing

### Critical Path Items
1. Backend API stability
2. Database migration approval
3. Authentication strategy decision
4. Domain/hosting setup

## Success Criteria (Technical)

### Performance Benchmarks
- First Contentful Paint < 1s
- Time to Interactive < 2s
- Message streaming latency < 500ms
- Search results < 1s

### Quality Gates
- Lighthouse score > 90
- Zero critical security vulnerabilities
- 80% code coverage for business logic
- All WCAG AA accessibility standards met

### Acceptance Criteria
- Users can continue conversations across sessions
- Patient analysis matches existing interface output
- Document weighting demonstrably affects results
- Export produces valid PDF/DOCX files

## Estimated Effort

### Timeline
- **Total Duration**: 10-12 weeks (single developer)
- **MVP (Tasks 1-5)**: 4 weeks
- **Full Feature Set**: 8 weeks
- **Polish & Deployment**: 2 weeks

### Resource Requirements
- 1 Full-stack developer (primary)
- Periodic backend support for API modifications
- UX review at week 4 and 8
- Security review before deployment

### Critical Milestones
- Week 2: Working chat interface
- Week 4: Persistent conversations (MVP)
- Week 6: Patient analysis integrated
- Week 8: Feature complete
- Week 10: Production ready

## Tasks Created
- [ ] #10 - Export & Reports (parallel: true)
- [ ] #11 - Deployment & Documentation (parallel: false)
- [ ] #2 - Project Setup (parallel: true)
- [ ] #3 - Authentication Flow (parallel: true)
- [ ] #4 - Database Schema (parallel: true)
- [ ] #5 - Core Chat UI (parallel: true)
- [ ] #6 - Conversation Persistence (parallel: true)
- [ ] #7 - RAG Integration (parallel: true)
- [ ] #8 - Patient Data Module (parallel: false)
- [ ] #9 - Document Selection (parallel: true)

Total tasks:       10
Parallel tasks:        8
Sequential tasks: 2
Estimated total effort: 116-148 hours (10-12 weeks)
