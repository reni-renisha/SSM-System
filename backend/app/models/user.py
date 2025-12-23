from sqlalchemy import Boolean, Column, Integer, String, Enum
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TEACHER = "teacher"
    THERAPIST = "therapist"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default=UserRole.ADMIN) 