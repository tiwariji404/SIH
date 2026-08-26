from sqlalchemy import Column, Integer, String, Enum
from app.db.session import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUB_ADMIN = "sub_admin"
    OPERATOR = "operator"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR)
    assigned_by = Column(Integer, nullable=True) # ID of the admin/sub-admin who assigned this user
