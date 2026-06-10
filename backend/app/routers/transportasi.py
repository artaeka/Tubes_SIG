"""
Router: Titik Transportasi (terminal, halte, titik naik-turun)
Endpoint publik  : GET /api/titik-transportasi, /api/titik-transportasi/{id}, /api/halte/radius
Endpoint admin   : POST, PUT, DELETE /api/admin/titik-transportasi
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast

from ..database import get_db
from .. import models, schemas
from ..utils.geo import point_to_coords, coords_to_wkt_point, build_geojson_feature, build_feature_collection
from ..utils.auth import require_admin
from geoalchemy2.types import Geography

router       = APIRouter(prefix="/api/titik-transportasi", tags=["Titik Transportasi - Publik"])
admin_router = APIRouter(prefix="/api/admin/titik-transportasi", tags=["Titik Transportasi - Admin"])
radius_router = APIRouter(prefix="/api/halte",               tags=["Pencarian Radius"])


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIK
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/", summary="Ambil semua titik transportasi")
def get_all_titik(
    jenis: str | None = Query(None, description="Filter: terminal / halte / sub-terminal"),
    db: Session = Depends(get_db),
):
    q = db.query(models.TitikTransportasi)
    if jenis:
        q = q.filter(models.TitikTransportasi.jenis_titik.ilike(f"%{jenis}%"))
    titiks = q.all()

    result = []
    for t in titiks:
        coords = point_to_coords(t.geom_point)
        result.append({
            "id_titik":   t.id_titik,
            "nama_titik": t.nama_titik,
            "jenis_titik":t.jenis_titik,
            "alamat":     t.alamat,
            "longitude":  coords[0] if coords else None,
            "latitude":   coords[1] if coords else None,
        })
    return result


@router.get("/geojson", summary="Semua titik transportasi dalam format GeoJSON")
def get_titik_geojson(db: Session = Depends(get_db)):
    titiks = db.query(models.TitikTransportasi).all()
    features = []
    for t in titiks:
        coords = point_to_coords(t.geom_point)
        features.append(build_geojson_feature(
            t.geom_point,
            {
                "id_titik":   t.id_titik,
                "nama_titik": t.nama_titik,
                "jenis_titik":t.jenis_titik,
                "alamat":     t.alamat,
                "longitude":  coords[0] if coords else None,
                "latitude":   coords[1] if coords else None,
            }
        ))
    return build_feature_collection(features)


@router.get("/{id_titik}", summary="Detail titik transportasi berdasarkan ID")
def get_titik_by_id(id_titik: int, db: Session = Depends(get_db)):
    titik = db.query(models.TitikTransportasi).filter(
        models.TitikTransportasi.id_titik == id_titik
    ).first()
    if not titik:
        raise HTTPException(status_code=404, detail="Titik transportasi tidak ditemukan")

    coords = point_to_coords(titik.geom_point)

    # Rute yang melewati titik ini
    rute_list = (
        db.query(models.RuteAKDP)
        .join(models.RuteTitik, models.RuteTitik.id_rute == models.RuteAKDP.id_rute)
        .filter(models.RuteTitik.id_titik == id_titik)
        .all()
    )

    return {
        "id_titik":   titik.id_titik,
        "nama_titik": titik.nama_titik,
        "jenis_titik":titik.jenis_titik,
        "alamat":     titik.alamat,
        "longitude":  coords[0] if coords else None,
        "latitude":   coords[1] if coords else None,
        "rute_yang_melewati": [
            {"id_rute": r.id_rute, "nama_trayek": r.nama_trayek, "kode_trayek": r.kode_trayek}
            for r in rute_list
        ],
    }


# ── Pencarian radius ────────────────────────────────────────────────────────────

@radius_router.get("/radius", summary="Cari halte/titik dalam radius tertentu (ST_DWithin)")
def get_halte_dalam_radius(
    lat:    float = Query(..., description="Latitude titik pusat"),
    lng:    float = Query(..., description="Longitude titik pusat"),
    radius: float = Query(1000, description="Radius pencarian dalam meter", ge=100, le=50000),
    jenis:  str | None = Query(None, description="Filter jenis titik"),
    db: Session = Depends(get_db),
):
    """
    Menggunakan ST_DWithin PostGIS untuk mencari titik transportasi
    dalam radius (meter) dari koordinat pengguna.
    """
    user_geog = func.ST_GeographyFromText(f"POINT({lng} {lat})")

    q = db.query(
        models.TitikTransportasi,
        func.ST_Distance(
            cast(models.TitikTransportasi.geom_point, Geography),
            user_geog,
        ).label("jarak_meter"),
    ).filter(
        func.ST_DWithin(
            cast(models.TitikTransportasi.geom_point, Geography),
            user_geog,
            radius,
        )
    )

    if jenis:
        q = q.filter(models.TitikTransportasi.jenis_titik.ilike(f"%{jenis}%"))

    q = q.order_by("jarak_meter")
    hasil = q.all()

    result = []
    for titik, jarak in hasil:
        coords = point_to_coords(titik.geom_point)
        result.append({
            "id_titik":   titik.id_titik,
            "nama_titik": titik.nama_titik,
            "jenis_titik":titik.jenis_titik,
            "alamat":     titik.alamat,
            "longitude":  coords[0] if coords else None,
            "latitude":   coords[1] if coords else None,
            "jarak_meter":round(jarak, 1),
        })
    return {"radius_meter": radius, "jumlah": len(result), "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.post("/", summary="Tambah titik transportasi baru")
def create_titik(
    payload: schemas.TitikCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    wkt = coords_to_wkt_point(payload.longitude, payload.latitude)
    titik = models.TitikTransportasi(
        nama_titik  = payload.nama_titik,
        jenis_titik = payload.jenis_titik,
        alamat      = payload.alamat,
        geom_point  = wkt,
    )
    db.add(titik)
    db.commit()
    db.refresh(titik)
    return {"message": "Titik transportasi berhasil ditambahkan", "id_titik": titik.id_titik}


@admin_router.put("/{id_titik}", summary="Update titik transportasi")
def update_titik(
    id_titik: int,
    payload: schemas.TitikUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    titik = db.query(models.TitikTransportasi).filter(
        models.TitikTransportasi.id_titik == id_titik
    ).first()
    if not titik:
        raise HTTPException(status_code=404, detail="Titik tidak ditemukan")

    update_data = payload.model_dump(exclude_unset=True)
    lng = update_data.pop("longitude", None)
    lat = update_data.pop("latitude", None)
    if lng is not None and lat is not None:
        titik.geom_point = coords_to_wkt_point(lng, lat)

    for key, value in update_data.items():
        setattr(titik, key, value)

    db.commit()
    return {"message": "Titik transportasi berhasil diperbarui"}


@admin_router.delete("/{id_titik}", summary="Hapus titik transportasi")
def delete_titik(
    id_titik: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    titik = db.query(models.TitikTransportasi).filter(
        models.TitikTransportasi.id_titik == id_titik
    ).first()
    if not titik:
        raise HTTPException(status_code=404, detail="Titik tidak ditemukan")
    db.delete(titik)
    db.commit()
    return {"message": "Titik transportasi berhasil dihapus"}
