# Dental RAG Web Architecture

## System Overview

The Dental RAG Web application uses a hybrid architecture combining remote AI services with local data storage.

```
┌─────────────────────────────────────────────────────────────┐
│                       User Browser                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Next.js Frontend                         │
│                    (Port 3000)                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Chat Interface                                     │  │
│  │  - Patient Data Upload                                │  │
│  │  - Conversation Management                            │  │
│  │  - NextAuth.js Authentication                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────┬──────────────────────────────┬────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐       ┌──────────────────────────┐
│  Local Backend API   │       │  Remote Analysis API     │
│  (Port 8000)         │       │  (rag-doc.dentalbrain.app)│
│                      │       │                          │
│  - Conversation      │       │  - AI Chat Analysis      │
│  - History Storage   │       │  - RAG Search            │
│  - MySQL Database    │       │  - Literature Search     │
│  - t_evaluation table│       │  - Report Generation     │
└──────────────────────┘       └──────────────────────────┘
```

## API Endpoints Distribution

### Remote API (https://rag-doc.dentalbrain.app)
**Purpose**: AI-powered analysis and chat functionality

- `/api/chat/intelligent` - General chat with GPT
- `/api/chat/analyze` - Dental analysis with RAG
- `/api/chat/upload-excel` - Process patient Excel data
- `/api/literature/*` - Literature search and retrieval

### Local Backend API (http://localhost:8000)
**Purpose**: Data persistence and conversation management

- `/api/conversations` - List user conversations
- `/api/conversations/[id]` - Get specific conversation
- `/api/chat/messages` - Store chat messages
- Database: MySQL with `t_evaluation` table

### Next.js API Routes (http://localhost:3000/api)
**Purpose**: Bridge between frontend and backend services

- `/api/conversations` - Proxy to local backend for conversation list
- `/api/conversations/[sessionId]` - Proxy for specific conversations
- `/api/auth/[...nextauth]` - Authentication endpoints
- `/api/proxy` - General proxy for other services

## Data Flow

### 1. Chat Message Flow
```
User Input → Next.js Frontend 
    → Remote API (analyze) 
    → Response to Frontend
    → Store in Local Backend (t_evaluation)
    → Display to User
```

### 2. Conversation History Flow
```
Page Load → Next.js Frontend
    → Local API Route (/api/conversations)
    → Local Backend (MySQL query)
    → Return conversation list
    → Display in Sidebar
```

### 3. Excel Upload Flow
```
Excel File → Frontend Parser
    → Extract Patient Data
    → Send to Remote API (analyze)
    → Generate Report
    → Store in Local Backend
    → Display Report
```

## Database Schema

### t_evaluation Table (MySQL)
Primary table for storing all interactions:

```sql
CREATE TABLE `t_evaluation` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `rid` int(10) DEFAULT NULL,
  `account_id` varchar(50) DEFAULT NULL,  -- User email from NextAuth
  `session_id` varchar(100) DEFAULT NULL, -- Conversation ID
  `api_type` varchar(50) DEFAULT NULL,    -- 'chat' for messages
  `user_message` mediumtext,              -- User input
  `ai_response` mediumtext,               -- AI response
  `model_used` varchar(50) DEFAULT NULL,
  `input_tokens` int(10) DEFAULT NULL,
  `output_tokens` int(10) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)
```

## Authentication Flow

1. User logs in via NextAuth.js
2. Email address becomes `account_id`
3. All API calls include user session
4. Backend filters data by `account_id`

## Environment Configuration

### Frontend (.env.local)
```bash
# Remote API for AI services
NEXT_PUBLIC_API_URL=https://rag-doc.dentalbrain.app
API_URL=https://rag-doc.dentalbrain.app

# Local backend for data storage
LOCAL_BACKEND_URL=http://localhost:8000

# Authentication
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=http://localhost:3000
```

### Backend (backend/.env)
```bash
# MySQL Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/dental_rag_dev

# Server Configuration
PORT=8000
```

## Key Design Decisions

1. **Hybrid Architecture**: Leverages existing remote AI services while maintaining local data control
2. **Session Storage**: Uses MySQL for reliable conversation persistence
3. **Authentication Mapping**: Simple email-based user identification
4. **API Routing**: Next.js acts as proxy to handle CORS and authentication
5. **Progressive Enhancement**: Core features work independently

## Security Considerations

- Authentication required for all data operations
- User data isolated by `account_id`
- Sensitive data stored locally, not sent to remote services
- CORS configured for local development
- Environment variables for API endpoints

## Deployment Strategy

### Development
- Frontend: Next.js dev server (port 3000)
- Backend: FastAPI with hot reload (port 8000)
- Database: Local MySQL instance

### Production
- Frontend: Vercel or static hosting
- Backend: Docker container with FastAPI
- Database: Managed MySQL service
- Remote API: Existing production service

## Monitoring & Logging

- Frontend errors logged to console
- Backend logs to stdout/file
- Database queries logged in development
- API response times tracked
- Token usage monitored for cost control