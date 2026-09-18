import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv, find_dotenv

from .database import get_db
from .models import User

# Load environment variables from .env file if present
load_dotenv(find_dotenv())

# JWT Secret Configuration - strictly required from environment or .env
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is missing or empty. "
        "Please set JWT_SECRET_KEY in your environment or local .env file."
    )

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security_scheme = HTTPBearer(auto_error=False)


def get_password_hash(password: str) -> str:
    """
    Hashes a plaintext password securely using the bcrypt algorithm.
    Never logs or exposes the plaintext password.
    """
    if not password:
        raise ValueError("Password cannot be empty.")

    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored bcrypt password hash.
    Returns True if the password matches, False otherwise.
    """
    if not plain_password or not hashed_password:
        return False

    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token containing the payload data and an expiration claim ('exp').
    The payload must include 'sub' and must NOT contain passwords or sensitive credentials.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str, secret_key: Optional[str] = None) -> Optional[dict]:
    """
    Decodes and verifies a JWT access token.
    Returns the payload dictionary if valid, or None if invalid, expired, malformed,
    or signed with an incorrect key.
    """
    key = secret_key if secret_key is not None else SECRET_KEY
    try:
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to retrieve the current authenticated User.
    Extracts Bearer token from the Authorization header, decodes & verifies the JWT,
    reads the 'sub' claim as user_id, queries the User table, and returns the User object.
    Raises HTTP 401 Unauthorized if token is missing, malformed, invalid, expired,
    incorrectly signed, has missing 'sub', or references a non-existent user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise credentials_exception

    try:
        user_id = int(user_id_raw)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user
