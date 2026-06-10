"""
Router: Autentikasi Admin
POST /api/auth/login   — login, dapat JWT token
POST /api/auth/logout  — logout (client hapus token)
GET  /api/auth/me      — info user yang sedang login
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..utils.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autentikasi"])


@router.post("/login", response_model=schemas.TokenResponse, summary="Login admin")
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token({"sub": str(user.id_user)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_nama":    user.nama,
        "user_role":    user.role,
    }


@router.post("/logout", summary="Logout admin")
def logout():
    # JWT stateless: client cukup hapus token dari storage-nya
    return {"message": "Logout berhasil. Hapus token di sisi client."}


@router.get("/me", summary="Info user yang sedang login")
def me(current_user: models.User = Depends(get_current_user)):
    return {
        "id_user":    current_user.id_user,
        "nama":       current_user.nama,
        "email":      current_user.email,
        "role":       current_user.role,
        "created_at": current_user.created_at,
    }
