from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models

# Import semua router
from .routers import rute, transportasi, kecamatan, fasilitas, auth, layers

# ── Buat tabel di database (jika belum ada) ─────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── Inisialisasi aplikasi ───────────────────────────────────────────────────────
app = FastAPI(
    title="WebGIS Rute AKDP Kabupaten Tulungagung",
    description=(
        "REST API untuk Sistem Informasi Geografis Rute Angkutan Umum "
        "Antar Kota Dalam Provinsi (AKDP) Kabupaten Tulungagung, Jawa Timur.\n\n"
        "**Endpoint publik** tidak memerlukan autentikasi.\n"
        "**Endpoint admin** (`/api/admin/...`) memerlukan Bearer Token dari `/api/auth/login`."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS: izinkan frontend ReactJS mengakses API ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ganti dengan domain frontend di production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Daftarkan semua router ──────────────────────────────────────────────────────
app.include_router(auth.router)

# Publik
app.include_router(rute.router)
app.include_router(transportasi.router)
app.include_router(transportasi.radius_router)
app.include_router(kecamatan.router)
app.include_router(fasilitas.router)
app.include_router(layers.router)

# Admin
app.include_router(rute.admin_router)
app.include_router(transportasi.admin_router)
app.include_router(fasilitas.admin_router)


# ── Health check ────────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "app":     "WebGIS AKDP Tulungagung",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "running",
    }
