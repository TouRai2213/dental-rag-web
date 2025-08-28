"""
Database initialization script for Dental RAG System
Creates database and tables with proper error handling
"""
import sys
import logging
from database import init_database

def main():
    """Initialize the database"""
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("Starting database initialization...")
        init_database()
        logger.info("Database initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()