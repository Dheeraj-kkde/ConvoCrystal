"""
Auth API — JWT login/register/refresh, PKCE OAuth, forgot-password.

Endpoints:
  POST /auth/login
  POST /auth/register
  POST /auth/refresh
  POST /auth/logout
  POST /auth/forgot-password
  POST /auth/reset-password
  POST /auth/verify-email
  POST /auth/resend-verification
  GET  /auth/oauth/{provider}        → redirect to provider
  GET  /auth/oauth/{provider}/callback
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_verification_token,
    generate_reset_token,
    hash_token,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    WorkspaceSetupRequest,
)
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "cc_refresh"
COOKIE_OPTS = dict(
    httponly=True,
    secure=not settings.DEBUG,
    samesite="lax",
    max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    path="/api/v1/auth",
)


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(REFRESH_COOKIE, token, **COOKIE_OPTS)


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")


def _make_token_response(user: User, response: Response) -> TokenResponse:
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(
        access_token=access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.from_orm_user(user),
    )


# ─── Login ────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()

    # Generic error — never reveal which field is wrong (prevents user enumeration)
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid credentials. Please try again."},
        )

    return _make_token_response(user, response)


# ─── Register ─────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_TAKEN", "message": "An account with this email already exists."},
        )

    # Create user (email unverified initially)
    verification_token = generate_verification_token()
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        is_verified=False,
        verification_token_hash=hash_token(verification_token),
        verification_token_expires=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(user)
    await db.flush()  # Get the id without committing

    # TODO: send verification email with verification_token
    # await email_service.send_verification(user.email, verification_token)

    return _make_token_response(user, response)


# ─── Silent Refresh ───────────────────────────────────────────────

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    response: Response,
    cc_refresh: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not cc_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_REFRESH_TOKEN", "message": "No refresh token provided"},
        )

    user_id = decode_refresh_token(cc_refresh)
    if not user_id:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_REFRESH", "message": "Refresh token is invalid or expired"},
        )

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, new_refresh)

    return RefreshResponse(
        access_token=new_access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ─── Logout ───────────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    _clear_refresh_cookie(response)


# ─── Forgot Password ──────────────────────────────────────────────

@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if user:
        reset_token = generate_reset_token()
        user.reset_token_hash = hash_token(reset_token)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        # TODO: await email_service.send_reset(user.email, reset_token)

    # Always return 204 — never confirm whether email exists


# ─── Reset Password ───────────────────────────────────────────────

@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hash_token(body.token)
    result = await db.execute(
        select(User).where(
            User.reset_token_hash == token_hash,
            User.reset_token_expires > datetime.now(timezone.utc),
            User.is_active == True,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TOKEN", "message": "Reset token is invalid or expired"},
        )

    user.hashed_password = hash_password(body.password)
    user.reset_token_hash = None
    user.reset_token_expires = None


# ─── Email Verification ───────────────────────────────────────────

@router.post("/verify-email", status_code=status.HTTP_204_NO_CONTENT)
async def verify_email(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hash_token(body.token)
    result = await db.execute(
        select(User).where(
            User.verification_token_hash == token_hash,
            User.verification_token_expires > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_TOKEN", "message": "Verification token is invalid or expired"},
        )

    user.is_verified = True
    user.verification_token_hash = None
    user.verification_token_expires = None


# ─── Resend Verification ──────────────────────────────────────────

@router.post("/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
async def resend_verification(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True, User.is_verified == False)
    )
    user = result.scalar_one_or_none()
    if user:
        token = generate_verification_token()
        user.verification_token_hash = hash_token(token)
        user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        # TODO: await email_service.send_verification(user.email, token)


# ─── Workspace Setup (step 3 of onboarding) ───────────────────────

@router.post("/workspace-setup", status_code=status.HTTP_204_NO_CONTENT)
async def workspace_setup(
    body: WorkspaceSetupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.workspace_name:
        current_user.workspace_name = body.workspace_name
    # TODO: send invites to body.invite_emails


# ─── OAuth — PKCE redirect (Google/GitHub) ────────────────────────

@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str, code_challenge: str, state: str):
    """Redirect to OAuth provider. Frontend initiates with PKCE code_challenge."""
    if provider not in ("google", "github"):
        raise HTTPException(status_code=400, detail="Unsupported provider")

    # TODO: Build real OAuth redirect URL from provider config
    # For now, return a placeholder 501
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={"code": "OAUTH_NOT_CONFIGURED", "message": f"OAuth {provider} not yet configured. Set client credentials in .env."},
    )


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Receive OAuth callback, exchange code for tokens, upsert user."""
    if provider not in ("google", "github"):
        raise HTTPException(status_code=400, detail="Unsupported provider")
    # TODO: implement token exchange + user upsert
    raise HTTPException(status_code=501, detail="OAuth callback not implemented")
