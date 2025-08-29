# Issue #4 Analysis: Database Schema

**Issue**: Database Schema  
**Epic**: rag-web  
**Parallel**: true  
**Dependencies**: None (NextAuth.js completed in Issue #3)

## Work Stream Breakdown

Based on existing backend API at `https://rag-doc.dentalbrain.app/`, this work focuses on frontend integration:

### Stream A: API Client & Environment Configuration  
**Agent Type**: general-purpose
**Scope**: Configure frontend to connect to existing backend
**Files to modify**:
- `.env.local` (API URL configuration)
- `src/lib/api/client.ts` (API base URL)
- `src/lib/api/conversations.ts` (backend integration)
- Backend API endpoint mapping documentation

**Work**:
- Configure API base URL to `https://rag-doc.dentalbrain.app/`
- Map existing `/api/chat/analyze` to frontend needs
- Set up authentication headers for API calls
- Test connectivity to existing backend services
- Document available API endpoints

**Can start**: ✅ Immediately (no dependencies)

### Stream B: Backend API Integration & Data Recording  
**Agent Type**: general-purpose
**Scope**: Integrate existing chat API with conversation recording
**Files to modify**:
- `src/lib/api/conversations.ts` (adapt to existing API)
- `src/services/` (new directory)
- `src/services/conversation-recorder.ts` (record to t_evaluation)
- Backend API endpoint extension (if needed)

**Work**:
- Map existing `/api/chat/analyze` response to conversation format
- Implement conversation recording to `t_evaluation` table
- Build session management using existing conversation_id
- Adapt user authentication to account_id field
- Test chat flow with database recording

**Can start**: ✅ Parallel with Stream A

### Stream C: UI Components & Chat Interface
**Agent Type**: general-purpose  
**Scope**: Create chat UI components for conversation interface
**Files to modify**:
- `src/components/chat/` (new directory)
- `src/components/chat/chat-interface.tsx`
- `src/components/chat/message-list.tsx` 
- `src/components/chat/message-input.tsx`
- `src/app/(main)/chat/` (new page)
- `src/app/(main)/chat/page.tsx`

**Work**:
- Build responsive chat interface components
- Implement message display with user/AI distinction
- Create message input with file upload capability
- Add conversation history management
- Integrate with existing authentication system

**Can start**: ✅ Immediately (can work parallel with API integration)

## Dependencies

**Stream Dependencies**:
- Stream A → Stream B: Database models needed for API endpoints
- Stream B → Stream C: API endpoints needed for frontend integration
- Stream A ↔ Stream C: Can work in parallel on types and configuration

**External Dependencies**:
- ✅ NextAuth.js authentication (completed in Issue #3)
- ✅ Next.js + TypeScript foundation (completed in Issue #2)

## Coordination Points

1. **Database Schema**: Stream A finalizes exact t_evaluation structure
2. **API Contracts**: Stream B defines exact endpoint schemas for Stream C
3. **Authentication Flow**: Stream C uses NextAuth session for Stream B's account_id mapping

## Success Criteria

**Stream A Complete When**:
- MySQL database running locally
- t_evaluation table created with proper schema
- FastAPI connects to MySQL successfully
- Database models match table structure

**Stream B Complete When**:
- All CRUD endpoints implemented and tested
- User authentication mapping working
- Data validation and error handling functional
- API documentation available

**Stream C Complete When**:
- Frontend can create/read/update/delete conversations
- TypeScript types match backend schemas
- Authentication integration working
- Error handling and loading states implemented

## Risk Assessment

**Low Risk**: Well-defined table structure and clear requirements
**Medium Risk**: User authentication mapping strategy needs validation
**Coordination Risk**: Minimal - streams have clear boundaries

## Timeline Estimate

**Parallel Execution**: 4-6 hours total
**Sequential Would Be**: 8-10 hours
**Efficiency Gain**: ~40% time savings