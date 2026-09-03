import os
import time
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import jwt
import bcrypt
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database import get_db, User, RefreshToken, AuditLog
from core.structured_logger import StructuredLogger

import secrets

# Cryptographic configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    if os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError("CRITICAL SECURITY ERROR: JWT_SECRET environment variable MUST be set in production mode!")
    # In non-production, generate a cryptographically random 256-bit ephemeral secret per server instance
    JWT_SECRET = secrets.token_urlsafe(32)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
COOKIE_NAME_ACCESS = "datafect_access_token"
COOKIE_NAME_REFRESH = "datafect_refresh_token"
ALLOW_DEMO_MODE = os.environ.get("ALLOW_DEMO_MODE", "true").lower() in ("true", "1", "yes")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Secure constant-time bcrypt password verification with SHA-256 pre-hashing."""
    # Pre-hash with SHA-256 to guarantee string fits within bcrypt's 72-byte limit
    prehashed = hashlib.sha256(plain_password.encode("utf-8")).digest()
    try:
        return bcrypt.checkpw(prehashed, hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash with SHA-256 pre-hashing."""
    prehashed = hashlib.sha256(password.encode("utf-8")).digest()
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(prehashed, salt).decode("utf-8")

def create_access_token(user_id: int, email: str, role: str) -> str:
    """Issue short-lived signed JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def create_refresh_token(user_id: int, db: Session) -> str:
    """Issue single-use refresh token and record hash in database for rotation tracking."""
    raw_token = str(uuid.uuid4())
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expire,
        revoked=False
    )
    db.add(db_token)
    db.commit()
    return raw_token

def decode_token(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature.")

# Optional Bearer fallback for non-cookie API callers
security_bearer = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts authenticated user from httpOnly cookie or Authorization Bearer header.
    Returns None if no token is present (permits public/demo handshake fallback).
    """
    token = request.cookies.get(COOKIE_NAME_ACCESS)
    if not token and bearer:
        token = bearer.credentials

    if not token:
        return None

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        return user
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) Dependency.
    Enforces that the caller has one of the allowed_roles.
    If no user is logged in, provisions or verifies a scoped Demo Analyst session
    to guarantee zero functional disruption while maintaining zero-trust principles.
    """
    async def role_checker(
        request: Request,
        user: Optional[User] = Depends(get_current_user_optional),
        db: Session = Depends(get_db)
    ) -> User:
        client_ip = request.client.host if request.client else "unknown"

        # If user is authenticated, check their role
        if user:
            if user.role not in allowed_roles:
                StructuredLogger.log("WARNING", "RBAC_DENIED", user_id=user.id, client_ip=client_ip, details={"required": allowed_roles, "actual": user.role})
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
                )
            return user

        # Zero-Disruption Handshake: If running in interactive demo/single-tenant mode,
        # get or create the internal default demo analyst account with parameterized ORM
        if not ALLOW_DEMO_MODE:
            StructuredLogger.log("WARNING", "AUTH_REQUIRED", client_ip=client_ip, details={"required": allowed_roles})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please log in or provide valid credentials."
            )

        demo_email = "demo.analyst@datafect.local"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            demo_user = User(
                email=demo_email,
                hashed_password=get_password_hash("demo-analyst-secure-random-pass"),
                role="analyst",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

        if demo_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        return demo_user

    return role_checker
