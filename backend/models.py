"""
Database models for Dental RAG System
SQLAlchemy models for t_evaluation table and conversation management
"""
from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from database import Base

class TEvaluation(Base):
    """
    SQLAlchemy model for t_evaluation table
    Handles conversation storage, cost tracking, and business analytics
    """
    __tablename__ = "t_evaluation"
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    
    # Business fields
    rid = Column(Integer, nullable=True, comment="治疗记录唯一ID")
    account_id = Column(String(50), nullable=True, comment="用户账户ID")
    session_id = Column(String(100), nullable=True, comment="API生成，用于关联单次会话的多个API调用")
    
    # API type and content
    api_type = Column(String(50), nullable=True, comment="API调用类型")
    report_type = Column(String(50), nullable=True, comment="报告类型")
    report_content = Column(Text, nullable=True, comment="报告内容")
    
    # Chat specific fields
    user_message = Column(Text, nullable=True, comment="用户消息")
    ai_response = Column(Text, nullable=True, comment="AI回复")
    
    # Request/Response data
    request_data = Column(Text, nullable=True, comment="请求数据")
    response_data = Column(Text, nullable=True, comment="响应数据")
    
    # AI model and cost tracking
    model_used = Column(String(50), nullable=True, comment="使用的AI模型")
    input_tokens = Column(Integer, nullable=True, comment="输入Token数量")
    output_tokens = Column(Integer, nullable=True, comment="输出Token数量")
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), comment="作成日時")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新日時")
    
    # Define indexes
    __table_args__ = (
        Index('idx_account_created', 'account_id', 'created_at'),
        Index('idx_rid_api_type', 'rid', 'api_type'),
        Index('idx_session_id', 'session_id'),
        Index('idx_report_type', 'report_type'),
        {'comment': '评估数据表'}
    )
    
    def __repr__(self):
        return f"<TEvaluation(id={self.id}, session_id='{self.session_id}', api_type='{self.api_type}')>"

# Pydantic models for API serialization/validation

class ChatMessageCreate(BaseModel):
    """Model for creating a new chat message"""
    model_config = {"protected_namespaces": ()}

    account_id: str = Field(..., description="User account ID")
    session_id: str = Field(..., description="Conversation session ID")
    user_message: str = Field(..., description="User input message")
    ai_response: str = Field(..., description="AI response message")
    model_used: Optional[str] = Field(None, description="AI model identifier")
    input_tokens: Optional[int] = Field(None, description="Input token count")
    output_tokens: Optional[int] = Field(None, description="Output token count")
    response_data: Optional[str] = Field(None, description="JSON string containing literature references, meta analysis results, etc.")

class ChatMessageResponse(BaseModel):
    """Model for chat message response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}

    id: int
    account_id: Optional[str]
    session_id: Optional[str]
    user_message: Optional[str]
    ai_response: Optional[str]
    model_used: Optional[str]
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    response_data: Optional[str]  # JSON string containing literature references, meta analysis results, etc.

class ConversationSummary(BaseModel):
    """Model for conversation summary"""
    model_config = {"protected_namespaces": ()}
    
    session_id: str
    account_id: str
    message_count: int
    first_message_at: datetime
    last_message_at: datetime
    total_input_tokens: Optional[int]
    total_output_tokens: Optional[int]
    first_user_message: Optional[str] = None

class TEvaluationCreate(BaseModel):
    """Model for creating any type of t_evaluation record"""
    model_config = {"protected_namespaces": ()}
    
    rid: Optional[int] = None
    account_id: Optional[str] = None
    session_id: Optional[str] = None
    api_type: Optional[str] = None
    report_type: Optional[str] = None
    report_content: Optional[str] = None
    user_message: Optional[str] = None
    ai_response: Optional[str] = None
    request_data: Optional[str] = None
    response_data: Optional[str] = None
    model_used: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None

class TEvaluationResponse(BaseModel):
    """Model for t_evaluation response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: int
    rid: Optional[int]
    account_id: Optional[str]
    session_id: Optional[str]
    api_type: Optional[str]
    report_type: Optional[str]
    report_content: Optional[str]
    user_message: Optional[str]
    ai_response: Optional[str]
    request_data: Optional[str]
    response_data: Optional[str]
    model_used: Optional[str]
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class ConversationListResponse(BaseModel):
    """Model for listing conversations"""
    model_config = {"protected_namespaces": ()}
    
    conversations: List[ConversationSummary]
    total_count: int
    page: int
    page_size: int

class DatabaseHealthResponse(BaseModel):
    """Model for database health check response"""
    model_config = {"protected_namespaces": ()}
    
    status: str
    database: str
    response_time_ms: Optional[float] = None
    pool_size: Optional[int] = None
    checked_out: Optional[int] = None
    error: Optional[str] = None

# API Type constants
class APIType:
    """Constants for API types"""
    UPLOAD = "upload"
    GENERATE_REPORT = "generate_report"
    CHAT = "chat"
    LITERATURE_SEARCH = "literature_search"
    UPDATE_ADDITIONAL_DATA = "update_additional_data"

class ReportType:
    """Constants for report types"""
    PATIENT = "patient"
    GP = "gp"
    SPECIALIST = "specialist"