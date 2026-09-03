import os
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("datafect-backend")

from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Request, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Import zero-trust database & auth modules
from core.database import init_db, get_db, User, RefreshToken, AuditLog
from core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    require_role,
    get_current_user_optional,
    COOKIE_NAME_ACCESS,
    COOKIE_NAME_REFRESH,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from core.structured_logger import StructuredLogger

# Import core pipeline modules
from core.parser import parse_file
from core.cleaner import run_cleaning_pipeline
from core.profiler import profile_all_columns
from core.quality import compute_quality_flags, compute_quality_score
from core.correlations import compute_correlations
from core.predictor import run_prediction_pipeline
from core.narrator import generate_narrative_story, call_grounded_chat
from core.schemas import (
    ChatRequest,
    ChatResponse,
    UploadResponse,
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    TokenResponse
)
from core.session_store import session_store
from core.rate_limiter import upload_rate_limiter, narrate_rate_limiter, chat_rate_limiter

# Initialize database schema
init_db()

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
is_prod = ENVIRONMENT == "production"

# Hide all API schema documentation endpoints in production to prevent public exposure
app = FastAPI(
    title="DataFect Zero-Trust Production Engine",
    version="3.0.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# ── Zero-Trust Security Middleware ──
@app.middleware("http")
async def zero_trust_security_middleware(request: Request, call_next):
    correlation_id = str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    response = await call_next(request)
    
    # Mandatory Content Security Policy (CSP) & Defense-in-depth headers
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https://*.onrender.com https://*.vercel.app;"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Correlation-ID"] = correlation_id
    return response

# CORS Configuration
allowed_origins_env = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.vercel\.app",
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB upper ceiling
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "true" if is_prod else "false").lower() in ("true", "1", "yes")
COOKIE_SAMESITE = "none" if SECURE_COOKIES else "lax"

# ── Global Exception Handler for Error Masking ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Pass through standard HTTPExceptions (like 400, 401, 403, 413, 429)
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )

    # Convert validation/parsing ValueErrors directly into structured 400 Bad Request
    if isinstance(exc, ValueError):
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc)}
        )

    correlation_id = getattr(request.state, "correlation_id", "N/A")
    StructuredLogger.log("ERROR", "UNHANDLED_EXCEPTION", request_id=correlation_id, client_ip=request.client.host if request.client else "unknown", details={"error": str(exc)})
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred while processing your request. Please try again.",
            "error": "Internal Server Error",
            "correlation_id": correlation_id
        }
    )

# ── Health & Diagnostics ──
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "zero_trust": True,
        "gemini_enabled": bool(os.environ.get("GEMINI_API_KEY"))
    }

# ── Authentication & RBAC Routes ──

@app.post("/api/auth/register", response_model=UserProfileResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user with parameterized ORM queries and bcrypt hashing."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed = get_password_hash(req.password)
    # Enforce least-privilege role: public registrants are strictly 'analyst'
    user = User(email=req.email, hashed_password=hashed, role="analyst", is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserProfileResponse(id=user.id, email=user.email, role=user.role, is_active=user.is_active)

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticates user, issues JWT access token and refresh token via httpOnly cookie."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(user.id, user.email, user.role)
    refresh_token = create_refresh_token(user.id, db)

    # Secure httpOnly cookie injection (immune to client-side XSS)
    response.set_cookie(
        key=COOKIE_NAME_ACCESS,
        value=access_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key=COOKIE_NAME_REFRESH,
        value=refresh_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE,
        max_age=7 * 24 * 3600
    )

    return TokenResponse(
        access_token=access_token,
        user=UserProfileResponse(id=user.id, email=user.email, role=user.role, is_active=user.is_active)
    )

@app.get("/api/auth/session", response_model=UserProfileResponse)
def get_or_create_session(
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Zero-Trust Session Handshake:
    Returns the current user profile, or automatically provisions a scoped Analyst
    token delivered via httpOnly cookie for zero-friction interactive EDA development.
    """
    if current_user:
        return UserProfileResponse(id=current_user.id, email=current_user.email, role=current_user.role, is_active=current_user.is_active)

    # Automatic secure session provision for interactive single-tenant / local mode
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

    access_token = create_access_token(demo_user.id, demo_user.email, demo_user.role)
    response.set_cookie(
        key=COOKIE_NAME_ACCESS,
        value=access_token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return UserProfileResponse(id=demo_user.id, email=demo_user.email, role=demo_user.role, is_active=demo_user.is_active)

@app.post("/api/auth/logout")
def logout_user(response: Response):
    """Clears authentication cookies."""
    response.delete_cookie(COOKIE_NAME_ACCESS, samesite=COOKIE_SAMESITE, secure=SECURE_COOKIES)
    response.delete_cookie(COOKIE_NAME_REFRESH, samesite=COOKIE_SAMESITE, secure=SECURE_COOKIES)
    return {"message": "Logged out successfully."}

# ── Core Analysis Pipeline Routes (Guarded by RBAC & Rate Limiting) ──

@app.post(
    "/api/upload",
    dependencies=[Depends(upload_rate_limiter)],
    response_model=UploadResponse
)
async def upload_dataset(
    file: UploadFile = File(...),
    target_col: Optional[str] = None,
    current_user: User = Depends(require_role(["analyst", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Unified Ingestion Endpoint:
    Guarded by RBAC (analyst/admin), 50MB chunked streaming limits, and owner-bound session storage.
    """
    raw_filename = os.path.basename(file.filename or "uploaded_data.csv")
    sanitized_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_filename)
    StructuredLogger.log("INFO", "FILE_UPLOAD_START", user_id=current_user.id, details={"filename": sanitized_filename})

    try:
        # Stream read in 64KB chunks to prevent Memory Exhaustion DoS
        chunks = []
        total_bytes = 0
        while True:
            chunk = await file.read(65536)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Uploaded file exceeds maximum allowed limit of {MAX_UPLOAD_BYTES // (1024*1024)}MB."
                )
            chunks.append(chunk)

        content_bytes = b"".join(chunks)

        if len(content_bytes) == 0:
            raise ValueError("Uploaded file is completely empty (0 bytes). Please upload a valid dataset.")

        import asyncio
        # 1. Parse File
        df, parse_meta = parse_file(content_bytes, sanitized_filename)

        # 2. Automated Clean
        cleaning_result = await asyncio.to_thread(run_cleaning_pipeline, df)
        cleaned_df = cleaning_result['cleaned_df']

        # 3. Statistical Profiler
        column_profiles = await asyncio.to_thread(profile_all_columns, cleaned_df)

        # 4, 5, 6: Quality, Correlation, Prediction
        def run_quality():
            flags = compute_quality_flags(column_profiles, cleaned_df)
            return compute_quality_score(cleaned_df, column_profiles, flags)

        quality_task = asyncio.to_thread(run_quality)
        correlation_task = asyncio.to_thread(compute_correlations, cleaned_df, column_profiles)
        prediction_task = asyncio.to_thread(run_prediction_pipeline, cleaned_df, column_profiles, target_col)

        quality_report, correlation_report, prediction_report = await asyncio.gather(
            quality_task, correlation_task, prediction_task
        )

        # Save to ephemeral multi-tenant session store bound to current_user.id
        session_id = session_store.set(cleaned_df, owner_id=current_user.id)

        # Parameterized DB audit trail
        audit_entry = AuditLog(
            user_id=current_user.id,
            session_id=session_id,
            action="UPLOAD",
            details=f"Rows: {parse_meta.get('row_count')}, Cols: {parse_meta.get('column_count')}"
        )
        db.add(audit_entry)
        db.commit()

        return {
            'metadata': parse_meta,
            'cleaning': {
                'audit_log': cleaning_result.get('audit_log', []),
                'rows_after': cleaning_result.get('rows_after', 0),
                'cols_after': cleaning_result.get('cols_after', 0)
            },
            'column_profiles': column_profiles,
            'quality': quality_report,
            'correlations': correlation_report,
            'prediction': prediction_report,
            'session_id': session_id
        }

    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except (UnicodeDecodeError, LookupError):
        raise HTTPException(status_code=400, detail="Unable to read the file's text encoding. Please re-save as UTF-8 or upload as an Excel (.xlsx) file.")
    except Exception as e:
        StructuredLogger.log("ERROR", "UPLOAD_FAILED", user_id=current_user.id, details={"error": str(e)})
        raise HTTPException(status_code=500, detail="An error occurred while processing your dataset. Please verify the file integrity.")

@app.post(
    "/api/narrate",
    dependencies=[Depends(narrate_rate_limiter)]
)
async def generate_ai_story(
    summary: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_role(["analyst", "admin"]))
):
    """
    Generate AI Story:
    Triggers Gemini 2.0 Flash to synthesize executive insights. Guarded by RBAC and rate limiting.
    """
    try:
        story_result = generate_narrative_story(summary)
        return story_result
    except Exception as e:
        StructuredLogger.log("ERROR", "NARRATIVE_FAILED", user_id=current_user.id, details={"error": str(e)})
        raise HTTPException(status_code=500, detail="AI narrative generation encountered an error.")

@app.post(
    "/api/chat",
    response_model=ChatResponse,
    dependencies=[Depends(chat_rate_limiter)]
)
async def chat_with_data(
    request: ChatRequest,
    current_user: User = Depends(require_role(["viewer", "analyst", "admin"]))
):
    """
    Grounded Chat:
    Answer questions about the dataset grounded in statistical summaries.
    Enforces IDOR authorization: caller can only access datasets they own.
    """
    try:
        history_list = [{'role': m.role, 'content': m.content} for m in request.history]

        # Retrieve caller's isolated DataFrame with IDOR check
        caller_df = session_store.get(request.session_id, caller_id=current_user.id)

        response_text, follow_ups = call_grounded_chat(
            history=history_list,
            message=request.message,
            summary_json=request.analysis_summary,
            df=caller_df
        )

        return ChatResponse(response=response_text, follow_up_questions=follow_ups)
    except Exception as e:
        StructuredLogger.log("ERROR", "CHAT_FAILED", user_id=current_user.id, details={"error": str(e)})
        raise HTTPException(status_code=500, detail="Data Assistant chat encountered an error.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
