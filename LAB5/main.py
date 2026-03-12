# =================================================================
# LAB 5 - FASTAPI AUTH BACKEND
# Topics: FastAPI, SQLAlchemy ORM, Alembic migrations,
#         JWT tokens, password hashing, routes, models
#
# HOW TO RUN:
#   python -m venv venv
#   source venv/bin/activate  (Linux/Mac)
#   venv\Scripts\activate     (Windows)
#
#   pip install fastapi uvicorn sqlalchemy alembic
#   pip install python-jose[cryptography] passlib[bcrypt] python-multipart
#
#   alembic init alembic
#   (update alembic.ini and env.py — see README below)
#   alembic revision --autogenerate -m "create users table"
#   alembic upgrade head
#
#   uvicorn main:app --reload
#   Open: http://localhost:8000/docs
# =================================================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Local imports (files in same folder)
from database import get_db
from models   import User
from schemas  import UserCreate, UserLogin, UserOut, Token
from auth     import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# Create the FastAPI app
app = FastAPI(
    title="LAB 5 — Auth API",
    description="Login and Register with JWT",
    version="1.0.0"
)

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTE: POST /register
# Register a new user
# ============================================================
@app.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    # Hash the password before storing
    hashed = hash_password(user_data.password)

    # Create new user object
    new_user = User(
        full_name     = user_data.full_name,
        email         = user_data.email,
        hashed_password = hashed,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # get auto-generated id

    return new_user


# ============================================================
# ROUTE: POST /login
# Login and receive a JWT token
# ============================================================
@app.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Check user exists AND password is correct
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Create JWT token with user's id as the subject
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


# ============================================================
# ROUTE: GET /me  (protected — requires valid JWT)
# Get logged-in user's profile
# ============================================================
@app.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================================
# ROUTE: GET /
# Health check
# ============================================================
@app.get("/")
def root():
    return {"message": "LAB 5 Auth API is running!"}
