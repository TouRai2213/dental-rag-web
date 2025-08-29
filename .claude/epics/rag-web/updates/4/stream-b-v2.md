---
issue: 4
stream: Backend API Integration & Data Recording
agent: general-purpose  
started: 2025-08-28T08:00:00Z
status: in_progress
---

# Stream B: Backend API Integration & Data Recording

## Scope
Integrate existing chat API with conversation recording to t_evaluation table

## Files to Modify
- `src/lib/api/conversations.ts` (adapt to existing API)
- `src/services/` (new directory)
- `src/services/conversation-recorder.ts` (record to t_evaluation)
- Backend API endpoint extension (if needed)

## Progress  
- Starting integration with existing backend
- Backend: https://rag-doc.dentalbrain.app/api/chat/analyze
- Target: Record conversations to t_evaluation table
- Authentication: Map NextAuth to account_id

## Tasks
1. Map existing `/api/chat/analyze` response to conversation format
2. Implement conversation recording to `t_evaluation` table  
3. Build session management using existing conversation_id
4. Adapt user authentication to account_id field
5. Test chat flow with database recording