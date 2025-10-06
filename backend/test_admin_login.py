#!/usr/bin/env python3
"""
Quick test for admin credentials
"""
import requests

def test_admin_login():
    try:
        response = requests.post("http://localhost:8000/api/v1/auth/login", 
                               data={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"Token: {data.get('access_token', 'N/A')[:30]}...")
            print(f"Role: {data.get('role', 'N/A')}")
            
            # Test creating a therapy report with this token
            token = data.get('access_token')
            if token:
                test_payload = {
                    "student_id": 1,
                    "therapy_type": "Speech Therapy",
                    "progress_notes": "Test note",
                    "goals_achieved": "Test goal",
                    "progress_level": "Good",
                    "report_date": "2025-10-07"
                }
                
                headers = {"Authorization": f"Bearer {token}"}
                test_response = requests.post("http://localhost:8000/api/v1/therapy-reports/", 
                                            json=test_payload, headers=headers)
                print(f"\nTest therapy report creation: {test_response.status_code}")
                if test_response.status_code == 200:
                    print("✅ Therapy report creation works!")
                else:
                    print(f"❌ Error: {test_response.text}")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_admin_login()