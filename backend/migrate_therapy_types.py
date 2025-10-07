#!/usr/bin/env python3
"""
Migration script to update therapy types to standardized format
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

def migrate_therapy_types():
    """Update therapy types to standardized format"""
    db = SessionLocal()
    try:
        # Mapping from old format to new standardized format
        therapy_type_mapping = {
            'Occupational': 'Occupational Therapy',
            'Physio': 'Physical Therapy', 
            'Speech': 'Speech Therapy',
            'Behavioral': 'Behavioral Therapy',
            'Developmental': 'Cognitive Therapy',  # Map Developmental to Cognitive
            'Clinical': 'Behavioral Therapy',      # Map Clinical to Behavioral
        }
        
        print("Starting therapy type migration...")
        print("=" * 50)
        
        total_updated = 0
        
        for old_type, new_type in therapy_type_mapping.items():
            # Count records with old type
            count_query = db.query(TherapyReport).filter(TherapyReport.therapy_type == old_type)
            count = count_query.count()
            
            if count > 0:
                print(f"Updating '{old_type}' → '{new_type}' ({count} records)")
                
                # Update all records with this therapy type
                count_query.update({TherapyReport.therapy_type: new_type}, synchronize_session=False)
                total_updated += count
            else:
                print(f"No records found for '{old_type}'")
        
        # Commit all changes
        db.commit()
        
        print("\n" + "=" * 50)
        print(f"Migration completed! Updated {total_updated} records.")
        
        # Verify the changes
        print("\nVerifying changes...")
        results = db.query(TherapyReport.therapy_type).distinct().all()
        therapy_types = [result[0] for result in results if result[0]]
        
        print("Current therapy types after migration:")
        for i, therapy_type in enumerate(therapy_types, 1):
            count = db.query(TherapyReport).filter(TherapyReport.therapy_type == therapy_type).count()
            print(f"{i}. '{therapy_type}' ({count} records)")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_therapy_types()