# models.py — SQLAlchemy ORM models (maps Python classes to DB tables)

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"   # name of the table in DB

    id               = Column(Integer, primary_key=True, index=True)
    full_name        = Column(String, nullable=False)
    email            = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=False)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
