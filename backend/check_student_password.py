#!/usr/bin/env python3
"""
Check student credentials
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from app.core.security import verify_password

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

engine = create_engine(DATABASE_URL)

print("\n🔍 Checking Student STU2026005...")
print("=" * 70)

with engine.connect() as conn:
    # Get student DOB
    result = conn.execute(text("SELECT student_id, name, dob FROM students WHERE student_id = 'STU2026005'"))
    student = result.fetchone()
    
    if student:
        student_id, name, dob = student
        print(f"\n✅ Student Found:")
        print(f"   Student ID: {student_id}")
        print(f"   Name: {name}")
        print(f"   Date of Birth: {dob}")
        
        # Calculate expected password (DDMMYYYY format)
        if dob:
            expected_password = dob.strftime("%d%m%Y")
            print(f"   Expected Password: {expected_password}")
        else:
            print("   ❌ No DOB found!")
            expected_password = None
        
        # Check user account
        result = conn.execute(text("SELECT username, role, is_active, hashed_password FROM users WHERE username = 'STU2026005'"))
        user = result.fetchone()
        
        if user:
            username, role, is_active, hashed_password = user
            print(f"\n✅ User Account Found:")
            print(f"   Username: {username}")
            print(f"   Role: {role}")
            print(f"   Active: {is_active}")
            
            # Test password
            if expected_password:
                password_match = verify_password(expected_password, hashed_password)
                print(f"\n🔐 Password Test:")
                print(f"   Testing password: {expected_password}")
                print(f"   Result: {'✅ MATCH' if password_match else '❌ NO MATCH'}")
                
                # Test the provided password
                print(f"\n   Testing password: 17042025")
                password_match_2 = verify_password("17042025", hashed_password)
                print(f"   Result: {'✅ MATCH' if password_match_2 else '❌ NO MATCH'}")
        else:
            print("\n❌ No user account found for STU2026005!")
            print("   The student record exists but no login account was created.")
    else:
        print("\n❌ Student STU2026005 not found in database!")

print("\n" + "=" * 70)
