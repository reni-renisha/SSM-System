from fastapi import APIRouter
from app.api.endpoints import students, teachers, therapists, auth, users, therapy_reports

api_router = APIRouter()
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(therapists.router, prefix="/therapists", tags=["therapists"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"]) 
api_router.include_router(therapy_reports.router, prefix="/therapy-reports", tags=["therapy-reports"])