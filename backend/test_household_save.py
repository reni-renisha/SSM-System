import requests
import json

base_url = "http://localhost:8000"

# Create a test student with household data
test_data = {
    "name": "Test Student Household",
    "age": 10,
    "gender": "Male",
    "class_name": "5th",
    "household": [
        {"name": "Father Test", "age": "45", "education": "Graduate", "occupation": "Engineer", "health": "Good", "income": "50000"},
        {"name": "Mother Test", "age": "42", "education": "Graduate", "occupation": "Teacher", "health": "Good", "income": "30000"}
    ]
}

print("Creating student with household data...")
response = requests.post(f"{base_url}/api/v1/students/", json=test_data)
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    student = response.json()
    print(f"Created student ID: {student['id']}")
    print(f"Household data saved: {student.get('household')}")
    
    # Fetch the student back to verify
    print(f"\nFetching student {student['id']} to verify...")
    get_response = requests.get(f"{base_url}/api/v1/students/{student['id']}")
    fetched_student = get_response.json()
    print(f"Household data retrieved: {fetched_student.get('household')}")
else:
    print(f"Error: {response.text}")
