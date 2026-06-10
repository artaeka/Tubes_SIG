from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ─────────────────────────────────────────
# GeoJSON helpers
# ─────────────────────────────────────────
class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Optional[GeoJSONGeometry] = None
    properties: dict


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


# ─────────────────────────────────────────
# Rute AKDP
# ─────────────────────────────────────────
class RuteBase(BaseModel):
    nama_trayek:     Optional[str] = None
    kode_trayek:     Optional[str] = None
    titik_awal:      Optional[str] = None
    titik_akhir:     Optional[str] = None
    jenis_angkutan:  Optional[str] = None
    jalur_dilalui:   Optional[str] = None
    panjang_rute:    Optional[float] = None
    waktu_tempuh:    Optional[str] = None
    jam_operasional: Optional[str] = None
    tarif:           Optional[float] = None
    status_rute:     Optional[str] = "Aktif"


class RuteCreate(RuteBase):
    nama_trayek: str   # wajib saat create
    geojson_geometry: Optional[dict] = None  # GeoJSON LineString dari frontend


class RuteUpdate(RuteBase):
    geojson_geometry: Optional[dict] = None


class RuteResponse(RuteBase):
    id_rute: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Titik Transportasi
# ─────────────────────────────────────────
class TitikBase(BaseModel):
    nama_titik:  Optional[str] = None
    jenis_titik: Optional[str] = None
    alamat:      Optional[str] = None


class TitikCreate(TitikBase):
    nama_titik: str
    longitude: float
    latitude:  float


class TitikUpdate(TitikBase):
    longitude: Optional[float] = None
    latitude:  Optional[float] = None


class TitikResponse(TitikBase):
    id_titik:  int
    longitude: Optional[float] = None
    latitude:  Optional[float] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Kecamatan
# ─────────────────────────────────────────
class KecamatanResponse(BaseModel):
    id_kecamatan:   int
    nama_kecamatan: str

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Fasilitas Umum
# ─────────────────────────────────────────
class FasilitasBase(BaseModel):
    nama_fasilitas:  Optional[str] = None
    jenis_fasilitas: Optional[str] = None
    alamat:          Optional[str] = None


class FasilitasCreate(FasilitasBase):
    nama_fasilitas: str
    longitude: float
    latitude:  float


class FasilitasUpdate(FasilitasBase):
    longitude: Optional[float] = None
    latitude:  Optional[float] = None


class FasilitasResponse(FasilitasBase):
    id_fasilitas: int
    longitude:    Optional[float] = None
    latitude:     Optional[float] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# Auth
# ─────────────────────────────────────────
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_nama:    str
    user_role:    str


# ─────────────────────────────────────────
# RuteTitik (relasi)
# ─────────────────────────────────────────
class RuteTitikCreate(BaseModel):
    id_titik: int
    urutan:   int


class RuteTitikResponse(BaseModel):
    id_rute_titik: int
    id_rute:       int
    id_titik:      int
    urutan:        int

    class Config:
        from_attributes = True