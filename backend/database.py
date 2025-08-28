"""
Database configuration and connection management for Dental RAG System
MySQL connection with SQLAlchemy, connection pooling, and error handling
"""
import os
import logging
from typing import AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:654123@localhost:3306/dental_rag_dev"
)

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False,          # Set to True for SQL debugging
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_database_url() -> str:
    """Get the current database URL"""
    return DATABASE_URL

def create_database_if_not_exists(database_name: str = "dental_rag_dev") -> bool:
    """
    Create database if it doesn't exist
    Returns True if database was created or already exists
    """
    try:
        # Handle SQLite databases
        if DATABASE_URL.startswith("sqlite"):
            # For SQLite, ensure the directory exists
            from pathlib import Path
            if "///" in DATABASE_URL:
                db_path = Path(DATABASE_URL.split("///")[1])
                db_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("SQLite database path prepared")
            return True
        
        # Handle MySQL databases
        # Create engine without database name to connect to MySQL server
        server_url = DATABASE_URL.rsplit('/', 1)[0]
        server_engine = create_engine(server_url)
        
        with server_engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SHOW DATABASES LIKE '{database_name}'"))
            exists = result.fetchone() is not None
            
            if not exists:
                # Create database
                conn.execute(text(f"CREATE DATABASE {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
                logger.info(f"Database '{database_name}' created successfully")
            else:
                logger.info(f"Database '{database_name}' already exists")
                
        server_engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        return False

def create_tables() -> bool:
    """
    Create all tables using the t_evaluation schema
    """
    try:
        with engine.connect() as conn:
            # Create t_evaluation table with the exact business schema
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS `t_evaluation` (
              `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
              `rid` int(10) DEFAULT NULL COMMENT '治疗记录唯一ID',
              `account_id` varchar(50) DEFAULT NULL COMMENT '用户账户ID',
              `session_id` varchar(100) DEFAULT NULL COMMENT 'API生成，用于关联单次会话的多个API调用',
              `api_type` varchar(50) DEFAULT NULL COMMENT 'API调用类型 "upload", "generate_report", "chat", "literature_search", "update_additional_data"',
              `report_type` varchar(50) DEFAULT NULL COMMENT '报告类型 "patient", "gp", "specialist" 仅当api_type为generate_report时有值',
              `report_content` mediumtext COMMENT '报告内容 仅当api_type为generate_report时有值',
              `user_message` mediumtext COMMENT '用户消息 仅当api_type为chat时有值',
              `ai_response` mediumtext COMMENT 'AI回复 仅当api_type为chat时有值',
              `request_data` mediumtext COMMENT '请求数据',
              `response_data` mediumtext COMMENT '响应数据',
              `model_used` varchar(50) DEFAULT NULL COMMENT '使用的AI模型',
              `input_tokens` int(10) DEFAULT NULL COMMENT '输入Token数量',
              `output_tokens` int(10) DEFAULT NULL COMMENT '输出Token数量',
              `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
              `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
              PRIMARY KEY (`id`),
              KEY `idx_account_created` (`account_id`,`created_at`) USING BTREE,
              KEY `idx_rid_api_type` (`rid`,`api_type`) USING BTREE,
              KEY `idx_session_id` (`session_id`) USING BTREE,
              KEY `idx_report_type` (`report_type`) USING BTREE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估数据表'
            """
            
            conn.execute(text(create_table_sql))
            conn.commit()
            logger.info("t_evaluation table created successfully")
            return True
            
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return False

@contextmanager
def get_db_session():
    """
    Context manager for database sessions with automatic cleanup
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()

def get_db() -> AsyncGenerator[Session, None]:
    """
    FastAPI dependency for database sessions
    """
    with get_db_session() as session:
        yield session

def test_connection() -> bool:
    """
    Test database connection
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return result.fetchone() is not None
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

def init_database():
    """
    Initialize database and tables
    """
    logger.info("Initializing database...")
    
    # Create database if not exists
    if not create_database_if_not_exists():
        raise Exception("Failed to create database")
    
    # Test connection
    if not test_connection():
        raise Exception("Failed to connect to database")
    
    # Create tables
    if not create_tables():
        raise Exception("Failed to create tables")
    
    logger.info("Database initialization completed successfully")

# Database health check
def health_check() -> dict:
    """
    Database health check for monitoring
    """
    try:
        with engine.connect() as conn:
            start_time = time.time()
            conn.execute(text("SELECT 1"))
            response_time = time.time() - start_time
            
            return {
                "status": "healthy",
                "database": "mysql",
                "response_time_ms": round(response_time * 1000, 2),
                "pool_size": engine.pool.size(),
                "checked_out": engine.pool.checkedout(),
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database": "mysql"
        }

import time  # Import for health check