"""
Router: Fasilitas Umum (pasar, sekolah, rumah sakit, dll)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..utils.geo import point_to_coords, coords_to_wkt_point, build_geojson_feature, build_feature_collection
from ..utils.auth import require_admin

router       = APIRouter(prefix="/api/fasilitas-umum",       tags=["Fasilitas Umum - Publik"])
admin_router = APIRouter(prefix="/api/admin/fasilitas-umum", tags=["Fasilitas Umum - Admin"])


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIK
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/", summary="Ambil semua fasilitas umum")
def get_all_fasilitas(
    jenis: str | None = Query(None, description="Filter jenis fasilitas"),
    db: Session = Depends(get_db),
):
    q = db.query(models.FasilitasUmum)
    if jenis:
        q = q.filter(models.FasilitasUmum.jenis_fasilitas.ilike(f"%{jenis}%"))

    result = []
    for f in q.all():
        coords = point_to_coords(f.geom_point)
        result.append({
            "id_fasilitas":    f.id_fasilitas,
            "nama_fasilitas":  f.nama_fasilitas,
            "jenis_fasilitas": f.jenis_fasilitas,
            "alamat":          f.alamat,
            "longitude":       coords[0] if coords else None,
            "latitude":        coords[1] if coords else None,
        })
    return result


@router.get("/geojson", summary="Fasilitas umum dalam format GeoJSON")
def get_fasilitas_geojson(db: Session = Depends(get_db)):
    fasilitas_list = db.query(models.FasilitasUmum).all()
    features = []
    for f in fasilitas_list:
        coords = point_to_coords(f.geom_point)
        features.append(build_geojson_feature(
            f.geom_point,
            {
                "id_fasilitas":    f.id_fasilitas,
                "nama_fasilitas":  f.nama_fasilitas,
                "jenis_fasilitas": f.jenis_fasilitas,
                "alamat":          f.alamat,
                "longitude":       coords[0] if coords else None,
                "latitude":        coords[1] if coords else None,
            }
        ))
    return build_feature_collection(features)


@router.get("/{id_fasilitas}", summary="Detail fasilitas berdasarkan ID")
def get_fasilitas_by_id(id_fasilitas: int, db: Session = Depends(get_db)):
    f = db.query(models.FasilitasUmum).filter(
        models.FasilitasUmum.id_fasilitas == id_fasilitas
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    coords = point_to_coords(f.geom_point)
    return {
        "id_fasilitas":    f.id_fasilitas,
        "nama_fasilitas":  f.nama_fasilitas,
        "jenis_fasilitas": f.jenis_fasilitas,
        "alamat":          f.alamat,
        "longitude":       coords[0] if coords else None,
        "latitude":        coords[1] if coords else None,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@admin_router.post("/", summary="Tambah fasilitas umum")
def create_fasilitas(
    payload: schemas.FasilitasCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    f = models.FasilitasUmum(
        nama_fasilitas  = payload.nama_fasilitas,
        jenis_fasilitas = payload.jenis_fasilitas,
        alamat          = payload.alamat,
        geom_point      = coords_to_wkt_point(payload.longitude, payload.latitude),
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"message": "Fasilitas berhasil ditambahkan", "id_fasilitas": f.id_fasilitas}


@admin_router.put("/{id_fasilitas}", summary="Update fasilitas umum")
def update_fasilitas(
    id_fasilitas: int,
    payload: schemas.FasilitasUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    f = db.query(models.FasilitasUmum).filter(
        models.FasilitasUmum.id_fasilitas == id_fasilitas
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    update_data = payload.model_dump(exclude_unset=True)
    lng = update_data.pop("longitude", None)
    lat = update_data.pop("latitude", None)
    if lng is not None and lat is not None:
        f.geom_point = coords_to_wkt_point(lng, lat)

    for key, value in update_data.items():
        setattr(f, key, value)

    db.commit()
    return {"message": "Fasilitas berhasil diperbarui"}


@admin_router.delete("/{id_fasilitas}", summary="Hapus fasilitas umum")
def delete_fasilitas(
    id_fasilitas: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    f = db.query(models.FasilitasUmum).filter(
        models.FasilitasUmum.id_fasilitas == id_fasilitas
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    db.delete(f)
    db.commit()
    return {"message": "Fasilitas berhasil dihapus"}
