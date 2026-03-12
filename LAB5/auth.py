# auth.py — Password hashing and JWT token logic

from passlib.context    import CryptContext
from jose               import JWTError, jwt
from datetime           import datetime, timedelta
from fastapi            import Depends, HTTPException, status
from fastapi.security   import OAuth2PasswordBearer
from sqlalchemy.orm     import Session

from database import get_db
from models   import User

# Secret key — in production, store in .env file!
SECRET_KEY  = "your-super-secret-key-change-this"
ALGORITHM   = "HS256"
EXPIRE_MINS = 60 * 24  # token valid for 24 hours

# Password hashing using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI where to get the token from (Authorization header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def hash_password(plain_password: str) -> str:
    """Hash a plain password — NEVER store plain text passwords!"""
    return pwd_context.hash(plain_password)


def verify_password(plain: str, hashed: str) -> bool:
    """Check if a plain password matches its hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    """Create a JWT token with user data and expiry."""
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(minutes=EXPIRE_MINS)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str       = Depends(oauth2_scheme),
    db:    Session   = Depends(get_db)
) -> User:
    """Decode JWT token and return the logged-in user."""
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail      = "Invalid or expired token.",
        headers     = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user
