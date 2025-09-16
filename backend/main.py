"""
FastAPI main application for Dental RAG System
Database Setup & Backend Foundation with t_evaluation table integration
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List
from urllib.parse import unquote
from pathlib import Path

from database import init_database, get_db_session, health_check
from models import (
    TEvaluation, 
    ChatMessageCreate, 
    ChatMessageResponse, 
    ConversationSummary, 
    TEvaluationCreate,
    TEvaluationResponse,
    ConversationListResponse,
    DatabaseHealthResponse,
    APIType
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager - handles startup and shutdown
    """
    # Startup
    logger.info("Starting Dental RAG Backend...")
    try:
        init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Dental RAG Backend...")

# Create FastAPI application
app = FastAPI(
    title="Dental RAG Backend API",
    description="Backend API for Dental RAG System with t_evaluation table integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development server
        "http://127.0.0.1:3000",
        "https://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "Dental RAG Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=DatabaseHealthResponse)
async def health():
    """Database health check endpoint"""
    return health_check()

# Database dependency
def get_db():
    """Database session dependency"""
    with get_db_session() as session:
        yield session

# Chat message endpoints
@app.post("/api/chat/messages", response_model=ChatMessageResponse)
async def create_chat_message(
    message: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new chat message in the conversation
    """
    try:
        db_message = TEvaluation(
            account_id=message.account_id,
            session_id=message.session_id,
            api_type=APIType.CHAT,
            user_message=message.user_message,
            ai_response=message.ai_response,
            model_used=message.model_used,
            input_tokens=message.input_tokens,
            output_tokens=message.output_tokens,
            response_data=message.response_data
        )
        
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        return ChatMessageResponse.from_orm(db_message)
        
    except Exception as e:
        logger.error(f"Error creating chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat message"
        )

@app.get("/api/chat/messages/{session_id}", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    account_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all chat messages for a conversation session
    """
    try:
        messages = db.query(TEvaluation).filter(
            TEvaluation.session_id == session_id,
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).order_by(TEvaluation.created_at.asc()).offset(skip).limit(limit).all()
        
        return [ChatMessageResponse.from_orm(msg) for msg in messages]
        
    except Exception as e:
        logger.error(f"Error fetching chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat messages"
        )

@app.delete("/api/chat/messages/{session_id}")
async def delete_chat_messages(
    session_id: str,
    account_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete all chat messages for a conversation session
    """
    try:
        # Delete all messages with the given session_id and account_id
        deleted_count = db.query(TEvaluation).filter(
            TEvaluation.session_id == session_id,
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).delete()
        
        db.commit()
        
        logger.info(f"Deleted {deleted_count} messages for session {session_id}")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Deleted {deleted_count} messages from conversation"
        }
        
    except Exception as e:
        logger.error(f"Error deleting chat messages: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat messages"
        )

@app.get("/api/conversations", response_model=ConversationListResponse)
async def get_conversations(
    account_id: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get list of conversations for a user
    """
    try:
        from sqlalchemy import func
        
        offset = (page - 1) * page_size
        
        # Get conversation summaries with first message
        # Use a subquery to get the first message for each session
        first_message_subquery = db.query(
            TEvaluation.session_id,
            func.min(TEvaluation.created_at).label('min_created_at')
        ).filter(
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).group_by(TEvaluation.session_id).subquery()
        
        # Get the actual first message by joining with the subquery
        first_messages = db.query(
            TEvaluation.session_id,
            TEvaluation.user_message.label('first_user_message')
        ).join(
            first_message_subquery,
            (TEvaluation.session_id == first_message_subquery.c.session_id) &
            (TEvaluation.created_at == first_message_subquery.c.min_created_at)
        ).filter(
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).subquery()
        
        conversations_query = db.query(
            TEvaluation.session_id,
            TEvaluation.account_id,
            func.count(TEvaluation.id).label('message_count'),
            func.min(TEvaluation.created_at).label('first_message_at'),
            func.max(TEvaluation.created_at).label('last_message_at'),
            func.sum(TEvaluation.input_tokens).label('total_input_tokens'),
            func.sum(TEvaluation.output_tokens).label('total_output_tokens'),
            first_messages.c.first_user_message
        ).outerjoin(
            first_messages, 
            TEvaluation.session_id == first_messages.c.session_id
        ).filter(
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).group_by(
            TEvaluation.session_id, 
            TEvaluation.account_id,
            first_messages.c.first_user_message
        ).order_by(
            func.max(TEvaluation.created_at).desc()
        ).offset(offset).limit(page_size)
        
        conversations = conversations_query.all()
        
        # Get total count
        total_query = db.query(TEvaluation.session_id).filter(
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT
        ).distinct()
        total_count = total_query.count()
        
        conversation_summaries = [
            ConversationSummary(
                session_id=conv.session_id,
                account_id=conv.account_id,
                message_count=conv.message_count,
                first_message_at=conv.first_message_at,
                last_message_at=conv.last_message_at,
                total_input_tokens=conv.total_input_tokens,
                total_output_tokens=conv.total_output_tokens,
                first_user_message=conv.first_user_message
            ) for conv in conversations
        ]
        
        return ConversationListResponse(
            conversations=conversation_summaries,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversations"
        )

@app.get("/api/chat/search")
async def search_chat_messages(
    account_id: str,
    query: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Search chat messages globally across all conversations
    """
    try:
        if not query.strip():
            return {
                "results": [],
                "total_count": 0,
                "query": query
            }
        
        # Search in both user messages and AI responses
        search_term = f"%{query}%"
        
        # Query messages that contain the search term
        messages = db.query(TEvaluation).filter(
            TEvaluation.account_id == account_id,
            TEvaluation.api_type == APIType.CHAT,
            (
                TEvaluation.user_message.ilike(search_term) |
                TEvaluation.ai_response.ilike(search_term)
            )
        ).order_by(TEvaluation.created_at.desc()).limit(limit).all()
        
        # Format results with conversation context
        results = []
        for msg in messages:
            # Get conversation summary for context
            first_message = db.query(TEvaluation).filter(
                TEvaluation.session_id == msg.session_id,
                TEvaluation.account_id == account_id,
                TEvaluation.api_type == APIType.CHAT
            ).order_by(TEvaluation.created_at.asc()).first()
            
            result = {
                "message_id": msg.id,
                "session_id": msg.session_id,
                "user_message": msg.user_message,
                "ai_response": msg.ai_response,
                "created_at": msg.created_at,
                "conversation_title": first_message.user_message[:50] if first_message and first_message.user_message else "Untitled Conversation",
                "match_in": []
            }
            
            # Determine where the match was found
            if msg.user_message and query.lower() in msg.user_message.lower():
                result["match_in"].append("user_message")
            if msg.ai_response and query.lower() in msg.ai_response.lower():
                result["match_in"].append("ai_response")
            
            results.append(result)
        
        return {
            "results": results,
            "total_count": len(results),
            "query": query
        }
        
    except Exception as e:
        logger.error(f"Error searching chat messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search chat messages"
        )

# Generic t_evaluation endpoints
@app.post("/api/evaluation", response_model=TEvaluationResponse)
async def create_evaluation_record(
    record: TEvaluationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new t_evaluation record (generic endpoint)
    """
    try:
        db_record = TEvaluation(**record.dict())
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        return TEvaluationResponse.from_orm(db_record)
        
    except Exception as e:
        logger.error(f"Error creating evaluation record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create evaluation record"
        )

@app.get("/api/evaluation/{record_id}", response_model=TEvaluationResponse)
async def get_evaluation_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific t_evaluation record by ID
    """
    try:
        record = db.query(TEvaluation).filter(TEvaluation.id == record_id).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation record not found"
            )
            
        return TEvaluationResponse.from_orm(record)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching evaluation record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch evaluation record"
        )

# Error handler for validation errors
@app.exception_handler(422)
async def validation_exception_handler(request, exc):
    """
    Custom handler for validation errors
    """
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )