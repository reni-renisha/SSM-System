#!/usr/bin/env python3
"""
Reset student password to their DOB
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.core.security import get_password_hash

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

print("\n🔧 Resetting Password for STU2026005...")
print("=" * 70)

db = SessionLocal()

try:
    # Get student DOB
    result = db.execute(text("SELECT student_id, name, dob FROM students WHERE student_id = 'STU2026005'"))
    student = result.fetchone()
    
    if student:
        student_id, name, dob = student
        print(f"\n✅ Student Found:")
        print(f"   Student ID: {student_id}")
        print(f"   Name: {name}")
        print(f"   Date of Birth: {dob}")
        
        # Calculate password (DDMMYYYY format)
        if dob:
            new_password = dob.strftime("%d%m%Y")
            print(f"   Setting Password to: {new_password}")
            
            # Hash the password
            hashed_password = get_password_hash(new_password)
            
            # Update the user's password
            result = db.execute(
                text("UPDATE users SET hashed_password = :pwd WHERE username = :user"),
                {"pwd": hashed_password, "user": student_id}
            )
            db.commit()
            
            print(f"\n✅ Password Reset Successfully!")
            print(f"   Username: STU2026005")
            print(f"   Password: {new_password}")
            print(f"\nYou can now login with these credentials.")
        else:
            print("   ❌ No DOB found!")
    else:
        print("\n❌ Student STU2026005 not found in database!")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
finally:
    db.close()

print("\n" + "=" * 70)
