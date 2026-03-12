# database.py — Sets up the database connection using SQLAlchemy

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite is the simplest — no setup needed, creates a local file
# For PostgreSQL use: "postgresql://user:password@localhost/dbname"
DATABASE_URL = "sqlite:///./lab5.db"

# Engine: the actual connection to the database
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed only for SQLite
)

# SessionLocal: each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: all models inherit from this
Base = declarative_base()


# Dependency: called in each route to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db       # provide DB session to the route
    finally:
        db.close()     # always close when request is done
