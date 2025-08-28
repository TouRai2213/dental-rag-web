"""
Development database configuration for Dental RAG System
SQLite fallback for testing when MySQL is not available
"""
import os
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, text
from database import Base, logger

def create_sqlite_database():
    """
    Create SQLite database with t_evaluation table for development/testing
    """
    # Create backend data directory
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)
    
    # SQLite database path
    db_path = data_dir / "dental_rag_dev.db"
    
    # Create SQLite engine
    sqlite_url = f"sqlite:///{db_path}"
    engine = create_engine(sqlite_url, echo=True)
    
    try:
        with engine.connect() as conn:
            # Create t_evaluation table with SQLite-compatible schema
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS t_evaluation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rid INTEGER DEFAULT NULL,
                account_id VARCHAR(50) DEFAULT NULL,
                session_id VARCHAR(100) DEFAULT NULL,
                api_type VARCHAR(50) DEFAULT NULL,
                report_type VARCHAR(50) DEFAULT NULL,
                report_content TEXT DEFAULT NULL,
                user_message TEXT DEFAULT NULL,
                ai_response TEXT DEFAULT NULL,
                request_data TEXT DEFAULT NULL,
                response_data TEXT DEFAULT NULL,
                model_used VARCHAR(50) DEFAULT NULL,
                input_tokens INTEGER DEFAULT NULL,
                output_tokens INTEGER DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
            
            conn.execute(text(create_table_sql))
            
            # Create indexes
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_account_created ON t_evaluation (account_id, created_at)",
                "CREATE INDEX IF NOT EXISTS idx_rid_api_type ON t_evaluation (rid, api_type)",
                "CREATE INDEX IF NOT EXISTS idx_session_id ON t_evaluation (session_id)",
                "CREATE INDEX IF NOT EXISTS idx_report_type ON t_evaluation (report_type)"
            ]
            
            for index_sql in indexes:
                conn.execute(text(index_sql))
            
            conn.commit()
            logger.info(f"SQLite database created successfully at {db_path}")
            return sqlite_url
            
    except Exception as e:
        logger.error(f"Error creating SQLite database: {e}")
        raise

def test_sqlite_connection(db_url):
    """Test SQLite connection"""
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='t_evaluation'"))
            table_exists = result.fetchone() is not None
            if table_exists:
                logger.info("SQLite database connection test successful")
                return True
            else:
                logger.error("t_evaluation table not found in SQLite database")
                return False
    except Exception as e:
        logger.error(f"SQLite connection test failed: {e}")
        return False

if __name__ == "__main__":
    # Create SQLite database for development
    try:
        sqlite_url = create_sqlite_database()
        if test_sqlite_connection(sqlite_url):
            print(f"Development database ready at: {sqlite_url}")
            print("Update your .env file with:")
            print(f"DATABASE_URL={sqlite_url}")
        else:
            print("Failed to setup development database")
    except Exception as e:
        print(f"Error setting up development database: {e}")