"""
Helper JWT untuk autentikasi admin.
"""
import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

SECRET_KEY  = os.getenv("SECRET_KEY", "apa")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 jam

bearer_scheme = HTTPBearer()


# ── Password ───────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    # Mengonversi password ke bytes dan membatasi maksimal 72 byte
    # untuk menghindari ValueError pada versi bcrypt terbaru.
    password_bytes = plain.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        # Mengonversi plain password dan hash yang disimpan di database ke bytes
        password_bytes = plain.encode('utf-8')[:72]
        hashed_bytes = hashed.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ── Token ──────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependency ─────────────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    payload = decode_token(credentials.credentials)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    user = db.query(models.User).filter(models.User.id_user == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan")
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak: hanya admin")
    return current_user