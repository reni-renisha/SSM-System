#!/usr/bin/env python3
"""
Test student login
"""
import requests

print("\n🔐 Testing Login for STU2026005...")
print("=" * 70)

try:
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data={
            "username": "STU2026005",
            "password": "17042025"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ LOGIN SUCCESSFUL!")
        print(f"   Username: STU2026005")
        print(f"   Password: 17042025")
        print(f"   Role: {data.get('role')}")
        print(f"   Token: {data.get('access_token')[:30]}...")
    else:
        print(f"\n❌ LOGIN FAILED!")
        print(f"   Status: {response.status_code}")
        print(f"   Error: {response.json().get('detail', 'Unknown error')}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("   Make sure the backend server is running.")

print("\n" + "=" * 70)
