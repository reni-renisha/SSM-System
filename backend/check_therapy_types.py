#!/usr/bin/env python3
"""
Quick script to check therapy types currently in the database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.models.therapy_report import TherapyReport
from app.db.session import SessionLocal

def check_therapy_types():
    """Check what therapy types are currently in the database"""
    db = SessionLocal()
    try:
        # Get all unique therapy types
        results = db.query(TherapyReport.therapy_type).distinct().all()
        
        print("Current therapy types in database:")
        print("=" * 40)
        
        therapy_types = [result[0] for result in results if result[0]]
        
        if not therapy_types:
            print("No therapy reports found in database")
            return
            
        for i, therapy_type in enumerate(therapy_types, 1):
            print(f"{i}. '{therapy_type}'")
            
        print("\n" + "=" * 40)
        print(f"Total unique therapy types: {len(therapy_types)}")
        
        # Also check total number of reports
        total_reports = db.query(TherapyReport).count()
        print(f"Total therapy reports: {total_reports}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_therapy_types()