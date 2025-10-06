#!/usr/bin/env python3
"""
Test script to check if authentication is working and if there are users in the system
"""
import requests
import json

def test_auth():
    base_url = "http://localhost:8000"
    
    print("🔧 Testing Authentication System")
    print("=" * 50)
    
    # Test 1: Check if auth endpoint exists
    try:
        # Try to login with dummy credentials (should fail but show endpoint works)
        response = requests.post(f"{base_url}/api/v1/auth/login", 
                               data={"username": "dummy", "password": "dummy"})
        print(f"1. Auth endpoint: ✅ Responds (status: {response.status_code})")
        if response.status_code == 401:
            print("   Expected 401 - endpoint working correctly")
        elif response.status_code == 422:
            print("   422 - form validation issue")
        else:
            print(f"   Unexpected response: {response.text}")
    except Exception as e:
        print(f"1. Auth endpoint: ❌ Error - {e}")
        return
    
    # Test 2: Check if we can access protected endpoint without token
    try:
        response = requests.post(f"{base_url}/api/v1/therapy-reports/", 
                               json={"student_id": "1", "therapy_type": "test"})
        print(f"2. Protected endpoint without token: status {response.status_code}")
        if response.status_code == 401 or response.status_code == 403:
            print("   ✅ Properly protected - returns authentication error")
        else:
            print(f"   ❌ Not protected properly - response: {response.text}")
    except Exception as e:
        print(f"2. Protected endpoint test: ❌ Error - {e}")
    
    # Test 3: Try some common default credentials
    test_credentials = [
        ("admin", "admin"),
        ("teacher", "teacher"),
        ("test", "test"),
        ("admin@example.com", "admin"),
    ]
    
    print("\n3. Testing common credentials:")
    for username, password in test_credentials:
        try:
            response = requests.post(f"{base_url}/api/v1/auth/login", 
                                   data={"username": username, "password": password})
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success with {username}:{password}")
                print(f"      Token: {data.get('access_token', 'N/A')[:20]}...")
                print(f"      Role: {data.get('role', 'N/A')}")
                return data.get('access_token')
            else:
                print(f"   ❌ Failed {username}:{password} - {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error testing {username}:{password} - {e}")
    
    print("\n🎯 Result:")
    print("   No valid credentials found. You may need to:")
    print("   1. Create a user account first")
    print("   2. Check if the database is properly set up")
    print("   3. Run any initial migrations or seed data")
    
    return None

if __name__ == "__main__":
    test_auth()