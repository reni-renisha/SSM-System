# Special School Management System - Backend

This is the backend API for the Special School Management System, built with FastAPI and PostgreSQL.

## Features

- Student management (CRUD operations)
- Teacher management (CRUD operations)
- PostgreSQL database integration
- Alembic migrations for database versioning

## Requirements
##changes

- Python 3.8+
- PostgreSQL
- pipenv or virtualenv

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Create a virtual environment and install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:

```
# Database settings
POSTGRES_USER=yourusername
POSTGRES_PASSWORD=yourpassword
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=school_management

# JWT Settings
SECRET_KEY=yoursecretkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Create the database in PostgreSQL:

```bash
createdb school_management
```

## Running Migrations

Initialize and apply database migrations:

```bash
alembic upgrade head
```

## Running the Application

Start the FastAPI application:

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Students

- `GET /students/`: Get all students
- `GET /students/{student_id}`: Get a specific student
- `POST /students/`: Create a new student
- `PUT /students/{student_id}`: Update a student
- `DELETE /students/{student_id}`: Delete a student

### Teachers

- `GET /teachers/`: Get all teachers
- `GET /teachers/{teacher_id}`: Get a specific teacher
- `POST /teachers/`: Create a new teacher
- `PUT /teachers/{teacher_id}`: Update a teacher
- `DELETE /teachers/{teacher_id}`: Delete a teacher 