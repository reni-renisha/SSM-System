#!/usr/bin/env python3
"""
Test script to verify therapy type filtering works correctly
"""

import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.therapy_report import TherapyReport
from app.db.session import SessionLocal

def test_filtering():
    """Test various filtering scenarios"""
    db = SessionLocal()
    try:
        print("Testing Therapy Type Filtering")
        print("=" * 40)
        
        # Get all therapy types
        therapy_types = db.query(TherapyReport.therapy_type).distinct().all()
        therapy_types = [t[0] for t in therapy_types if t[0]]
        
        print("Available therapy types:")
        for t_type in sorted(therapy_types):
            count = db.query(TherapyReport).filter(TherapyReport.therapy_type == t_type).count()
            print(f"  - '{t_type}': {count} reports")
        
        print("\n" + "=" * 40)
        print("Testing exact matching...")
        
        # Test each therapy type filtering
        for t_type in sorted(therapy_types):
            filtered_count = db.query(TherapyReport).filter(
                TherapyReport.therapy_type == t_type
            ).count()
            
            print(f"Filter '{t_type}': {filtered_count} matches")
            
            # Show a sample report
            sample = db.query(TherapyReport).filter(
                TherapyReport.therapy_type == t_type
            ).first()
            
            if sample:
                print(f"  Sample: ID={sample.id}, Date={sample.report_date}, Type='{sample.therapy_type}'")
        
        # Test date filtering
        print("\n" + "=" * 40)
        print("Testing date range filtering...")
        
        from datetime import datetime, date
        
        # Get date range of reports
        min_date = db.query(TherapyReport.report_date).order_by(TherapyReport.report_date.asc()).first()[0]
        max_date = db.query(TherapyReport.report_date).order_by(TherapyReport.report_date.desc()).first()[0]
        
        print(f"Reports date range: {min_date} to {max_date}")
        
        # Test filtering by a specific date range
        mid_date = date(2024, 6, 1)  # Example middle date
        
        before_count = db.query(TherapyReport).filter(
            TherapyReport.report_date < mid_date
        ).count()
        
        after_count = db.query(TherapyReport).filter(
            TherapyReport.report_date >= mid_date
        ).count()
        
        print(f"Reports before {mid_date}: {before_count}")
        print(f"Reports from {mid_date} onwards: {after_count}")
        print(f"Total: {before_count + after_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_filtering()