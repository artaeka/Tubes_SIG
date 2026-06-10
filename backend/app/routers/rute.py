"""
Router: Rute AKDP
Endpoint publik  : GET /api/rute, /api/rute/{id}, /api/rute/search, /api/rute/geojson
Endpoint admin   : POST, PUT, DELETE /api/admin/rute
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast
from geoalchemy2.functions import ST_AsGeoJSON, ST_GeomFromText, ST_Length, ST_Transform
from geoalchemy2.types import Geography
import json

from ..database import get_db
from .. import models, schemas
from ..utils.geo import geom_to_geojson, geojson_to_wkt, build_geojson_feature, build_feature_collection
from ..utils.auth import require_admin

# ── Dua router: publik & admin ──────────────────────────────────────────────────
router       = APIRouter(prefix="/api/rute",       tags=["Rute AKDP - Publik"])
admin_router = APIRouter(prefix="/api/admin/rute", tags=["Rute AKDP - Admin"])


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIK
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/", summary="Ambil semua rute AKDP")
def get_all_rute(
    status_rute: bool | None = Query(None, description="Filter aktif/nonaktif"),
    jenis: str | None = Query(None, description="Filter jenis angkutan"),
    db: Session = Depends(get_db),
):
    q = db.query(models.RuteAKDP)
    if status_rute is not None:
        q = q.filter(models.RuteAKDP.status_rute == status_rute)
    if jenis:
        q = q.filter(models.RuteAKDP.jenis_angkutan.ilike(f"%{jenis}%"))
    rutes = q.all()

    result = []
    for r in rutes:
        result.append({
            "id_rute":        r.id_rute,
            "nama_trayek":    r.nama_trayek,
            "kode_trayek":    r.kode_trayek,
            "titik_awal":     r.titik_awal,
            "titik_akhir":    r.titik_akhir,
            "jenis_angkutan": r.jenis_angkutan,
            "panjang_rute":   r.panjang_rute,
            "waktu_tempuh":   r.waktu_tempuh,
            "jam_operasional":r.jam_operasional,
            "tarif":          r.tarif,
            "status_rute":    r.status_rute,
        })
    return result


@router.get("/geojson", summary="Semua rute dalam format GeoJSON FeatureCollection")
def get_rute_geojson(db: Session = Depends(get_db)):
    rutes = db.query(models.RuteAKDP).all()
    features = []
    for r in rutes:
        features.append(build_geojson_feature(
            r.geom_linestring,
            {
                "id_rute":        r.id_rute,
                "nama_trayek":    r.nama_trayek,
                "kode_trayek":    r.kode_trayek,
                "titik_awal":     r.titik_awal,
                "titik_akhir":    r.titik_akhir,
                "jenis_angkutan": r.jenis_angkutan,
                "panjang_rute":   r.panjang_rute,
                "tarif":          r.tarif,
                "jam_operasional":r.jam_operasional,
                "status_rute":    r.status_rute,
            }
        ))
    return build_feature_collection(features)


@router.get("/search", summary="Cari rute berdasarkan kata kunci / asal / tujuan")
def search_rute(
    q: str = Query(..., description="Kata kunci pencarian (nama trayek, asal, tujuan, kode)"),
    db: Session = Depends(get_db),
):
    keyword = f"%{q}%"
    rutes = db.query(models.RuteAKDP).filter(
        or_(
            models.RuteAKDP.nama_trayek.ilike(keyword),
            models.RuteAKDP.kode_trayek.ilike(keyword),
            models.RuteAKDP.titik_awal.ilike(keyword),
            models.RuteAKDP.titik_akhir.ilike(keyword),
            models.RuteAKDP.jalur_dilalui.ilike(keyword),
        )
    ).all()

    return [
        {
            "id_rute":     r.id_rute,
            "nama_trayek": r.nama_trayek,
            "kode_trayek": r.kode_trayek,
            "titik_awal":  r.titik_awal,
            "titik_akhir": r.titik_akhir,
            "tarif":       r.tarif,
            "status_rute": r.status_rute,
        }
        for r in rutes
    ]


@router.get("/nearest", summary="Cari rute terdekat dari koordinat pengguna")
def nearest_route(
    lat: float = Query(..., description="Latitude pengguna"),
    lng: float = Query(..., description="Longitude pengguna"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Menggunakan ST_Distance (PostGIS) untuk menemukan rute terdekat
    dari titik koordinat pengguna.
    """
    user_point = f"SRID=4326;POINT({lng} {lat})"

    rutes = (
        db.query(
            models.RuteAKDP,
            func.ST_Distance(
                cast(models.RuteAKDP.geom_linestring, Geography),
                cast(func.ST_GeomFromText(f"POINT({lng} {lat})", 4326), Geography),
            ).label("jarak_meter"),
        )
        .filter(models.RuteAKDP.geom_linestring.isnot(None))
        .order_by("jarak_meter")
        .limit(limit)
        .all()
    )

    return [
        {
            "id_rute":      r.RuteAKDP.id_rute,
            "nama_trayek":  r.RuteAKDP.nama_trayek,
            "titik_awal":   r.RuteAKDP.titik_awal,
            "titik_akhir":  r.RuteAKDP.titik_akhir,
            "jarak_meter":  round(r.jarak_meter, 1),
        }
        for r in rutes
    ]


@router.get("/{id_rute}", summary="Detail satu rute berdasarkan ID")
def get_rute_by_id(id_rute: int, db: Session = Depends(get_db)):
    rute = db.query(models.RuteAKDP).filter(models.RuteAKDP.id_rute == id_rute).first()
    if not rute:
        raise HTTPException(status_code=404, detail="Rute tidak ditemukan")

    # Ambil titik-titik pemberhentian yang terkait
    stops = (
        db.query(models.TitikTransportasi, models.RuteTitik.urutan)
        .join(models.RuteTitik, models.RuteTitik.id_titik == models.TitikTransportasi.id_titik)
        .filter(models.RuteTitik.id_rute == id_rute)
        .order_by(models.RuteTitik.urutan)
        .all()
    )

    from ..utils.geo import point_to_coords
    stops_data = []
    for titik, urutan in stops:
        coords = point_to_coords(titik.geom_point)
        stops_data.append({
            "id_titik":   titik.id_titik,
            "nama_titik": titik.nama_titik,
            "jenis_titik":titik.jenis_titik,
            "urutan":     urutan,
            "longitude":  coords[0] if coords else None,
            "latitude":   coords[1] if coords else None,
        })

    return {
        "id_rute":         rute.id_rute,
        "nama_trayek":     rute.nama_trayek,
        "kode_trayek":     rute.kode_trayek,
        "titik_awal":      rute.titik_awal,
        "titik_akhir":     rute.titik_akhir,
        "jenis_angkutan":  rute.jenis_angkutan,
        "jalur_dilalui":   rute.jalur_dilalui,
        "panjang_rute":    rute.panjang_rute,
        "waktu_tempuh":    rute.waktu_tempuh,
        "jam_operasional": rute.jam_operasional,
        "tarif":           rute.tarif,
        "status_rute":     rute.status_rute,
        "geometry":        geom_to_geojson(rute.geom_linestring),
        "stops":           stops_data,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.post("/", summary="Tambah rute baru")
def create_rute(
    payload: schemas.RuteCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    geom_wkt = None
    if payload.geojson_geometry:
        geom_wkt = geojson_to_wkt(payload.geojson_geometry)

    rute = models.RuteAKDP(
        nama_trayek     = payload.nama_trayek,
        kode_trayek     = payload.kode_trayek,
        titik_awal      = payload.titik_awal,
        titik_akhir     = payload.titik_akhir,
        jenis_angkutan  = payload.jenis_angkutan,
        jalur_dilalui   = payload.jalur_dilalui,
        panjang_rute    = payload.panjang_rute,
        waktu_tempuh    = payload.waktu_tempuh,
        jam_operasional = payload.jam_operasional,
        tarif           = payload.tarif,
        status_rute     = payload.status_rute,
        geom_linestring = geom_wkt,
    )
    db.add(rute)
    db.commit()
    db.refresh(rute)
    return {"message": "Rute berhasil ditambahkan", "id_rute": rute.id_rute}


@admin_router.put("/{id_rute}", summary="Update data rute")
def update_rute(
    id_rute: int,
    payload: schemas.RuteUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    rute = db.query(models.RuteAKDP).filter(models.RuteAKDP.id_rute == id_rute).first()
    if not rute:
        raise HTTPException(status_code=404, detail="Rute tidak ditemukan")

    update_data = payload.model_dump(exclude_unset=True)
    geojson = update_data.pop("geojson_geometry", None)
    if geojson:
        rute.geom_linestring = geojson_to_wkt(geojson)

    for key, value in update_data.items():
        setattr(rute, key, value)

    db.commit()
    return {"message": "Rute berhasil diperbarui"}


@admin_router.delete("/{id_rute}", summary="Hapus rute")
def delete_rute(
    id_rute: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    rute = db.query(models.RuteAKDP).filter(models.RuteAKDP.id_rute == id_rute).first()
    if not rute:
        raise HTTPException(status_code=404, detail="Rute tidak ditemukan")
    db.delete(rute)
    db.commit()
    return {"message": "Rute berhasil dihapus"}