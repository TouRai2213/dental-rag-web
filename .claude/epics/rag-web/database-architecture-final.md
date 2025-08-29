# Database Architecture - Final Design

**Date**: 2025-08-28  
**Status**: FINALIZED  
**Context**: Dental RAG Web Interface Database Integration

## Architecture Overview

### System Layout
- **Server A**: PostgreSQL (existing business database) + FastAPI backend
- **Frontend A**: Next.js web interface (this project)
- **Frontend B**: Existing dental assistance system (separate)
- **Connection**: API-based communication (no direct database access)

### Key Decisions

#### 1. Use Existing Business Table Structure
- **Primary Table**: `t_evaluation` (existing business table)
- **Purpose**: Unified conversation storage + cost tracking + business analytics
- **Rationale**: Maintains business system consistency and eliminates duplicate data structures

#### 2. API-First Data Access
- **Method**: FastAPI endpoints for all database operations
- **Security**: PostgreSQL not externally accessible (Server A only)
- **Benefits**: Clean separation, better security, consistent data validation

#### 3. User Association Strategy
- **Field**: `account_id` in t_evaluation table
- **Frontend A**: Defines own mapping method (NextAuth user → account_id)
- **Frontend B**: Uses separate mapping method (existing system)
- **Independence**: Two systems don't need to interoperate

## Table Structure Analysis

### t_evaluation Table Functions
1. **Cost Tracking**: Business expense and usage analytics
2. **Conversation Storage**: Chat history and message persistence  
3. **Business Analytics**: Performance and usage metrics
4. **Multi-System Support**: Serves both frontend systems independently

### Eliminated Tables
- ~~`conversations`~~ → Merged into t_evaluation
- ~~`messages`~~ → Stored within t_evaluation structure
- ~~`users`~~ → Use NextAuth + account_id mapping

## Implementation Strategy

### Phase 1: API Layer
- Create FastAPI endpoints for t_evaluation CRUD operations
- Implement authentication mapping (NextAuth → account_id)
- Add data validation and error handling

### Phase 2: Frontend Integration
- Configure API client in Next.js application
- Implement conversation management using t_evaluation structure
- Create TypeScript types for API responses

### Phase 3: Business Integration
- Ensure compatibility with existing Frontend B system
- Verify cost tracking and analytics functionality
- Test dual-system operation

## Technical Specifications

### API Endpoints (Planned)
```
POST   /api/conversations          # Create new conversation
GET    /api/conversations          # List user conversations  
GET    /api/conversations/{id}     # Get conversation details
PUT    /api/conversations/{id}     # Update conversation
DELETE /api/conversations/{id}     # Delete conversation
POST   /api/conversations/{id}/messages  # Add message
```

### Authentication Flow
```
NextAuth Session → User ID → account_id mapping → t_evaluation queries
```

### Data Flow
```
Next.js Frontend → FastAPI Backend → PostgreSQL (t_evaluation) → Response
```

## Benefits of This Architecture

1. **Business Consistency**: Single table for all conversation-related data
2. **Cost Efficiency**: No duplicate infrastructure or data storage
3. **System Independence**: Frontend A/B operate independently
4. **Security**: API-mediated access with proper authentication
5. **Scalability**: Can serve multiple frontend systems
6. **Analytics**: Unified business intelligence from single table

## Next Steps

1. **Issue #4**: Implement API endpoints and frontend integration
2. **Issue #5**: Build chat UI using new API structure
3. **Issue #6**: Implement conversation persistence through t_evaluation
4. **Testing**: Verify business table compatibility and dual-system operation

---

*This design eliminates the need for separate conversation/message tables while maintaining full functionality and business system compatibility.*