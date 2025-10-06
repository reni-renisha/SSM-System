"""
Simple test to verify the enhanced AI analysis API is working
"""

import requests
import json

def test_api():
    """Test the enhanced API endpoint"""
    
    print("🧪 Testing Enhanced AI Analysis API")
    print("=" * 40)
    
    # Test endpoint
    url = "http://localhost:8000/api/v1/therapy-reports/summary/ai"
    
    # Sample payload
    payload = {
        "student_id": "STU2025001",
        "from_date": None,
        "to_date": None,
        "therapy_type": None,
        "model": "facebook/bart-large-cnn"
    }
    
    try:
        # Make the request (this will likely fail due to auth, but we can see the structure)
        response = requests.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response structure:")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Backend server may not be running")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n📋 Expected Response Structure:")
    expected = {
        "student_id": "STU2025001",
        "model": "facebook/bart-large-cnn",
        "used_reports": "number",
        "truncated": "boolean",
        "summary": "AI-generated summary",
        "brief_overview": "Overview of progress",
        "start_date_analysis": "Initial assessment",
        "end_date_analysis": "Current status", 
        "improvement_metrics": {
            "total_sessions": "number",
            "therapy_types_count": "number",
            "improvement_trend": "description"
        },
        "recommendations": "AI recommendations",
        "date_range": {
            "start_date": "date",
            "end_date": "date",
            "total_days": "number"
        }
    }
    print(json.dumps(expected, indent=2))

if __name__ == "__main__":
    test_api()