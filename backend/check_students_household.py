import requests

base_url = "http://localhost:8000"

# Get all students
response = requests.get(f"{base_url}/api/v1/students/")
data = response.json()

print(f"Response keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")

if isinstance(data, dict) and 'items' in data:
    students = data['items']
elif isinstance(data, list):
    students = data
else:
    students = []
    print(f"Unexpected response format: {data}")

print(f"\nTotal students: {len(students)}")
print("\nStudents with household data:")
for student in students:
    if student.get('household'):
        print(f"  ID: {student['id']}, Name: {student['name']}, Household entries: {len(student['household'])}")
        print(f"    Household: {student['household'][:2]}")  # Show first 2 entries
