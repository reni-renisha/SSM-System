"""
CRUD operations for database models.

This module provides standard Create, Read, Update, Delete operations
for all data models in the application.

Note: The following files are deprecated and maintained only for backward compatibility:
- crud_user.py (use user.py instead)
- crud_student.py (use student.py instead)
"""

from app.crud.student import student
from app.crud.teacher import teacher
from app.crud.user import user 
from app.crud import therapy_report