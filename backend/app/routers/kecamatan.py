"""
Router: Kecamatan (batas administrasi)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..utils.geo import geom_to_geojson, build_geojson_feature, build_feature_collection

router = APIRouter(prefix="/api/kecamatan", tags=["Kecamatan"])


@router.get("/", summary="Ambil semua data kecamatan")
def get_all_kecamatan(db: Session = Depends(get_db)):
    kecamatans = db.query(models.Kecamatan).all()
    return [
        {"id_kecamatan": k.id_kecamatan, "nama_kecamatan": k.nama_kecamatan}
        for k in kecamatans
    ]


@router.get("/geojson", summary="Semua kecamatan dalam format GeoJSON (untuk layer peta)")
def get_kecamatan_geojson(db: Session = Depends(get_db)):
    kecamatans = db.query(models.Kecamatan).all()
    features = [
        build_geojson_feature(
            k.geom_polygon,
            {"id_kecamatan": k.id_kecamatan, "nama_kecamatan": k.nama_kecamatan},
        )
        for k in kecamatans
    ]
    return build_feature_collection(features)


@router.get("/{id_kecamatan}", summary="Detail kecamatan berdasarkan ID")
def get_kecamatan_by_id(id_kecamatan: int, db: Session = Depends(get_db)):
    k = db.query(models.Kecamatan).filter(models.Kecamatan.id_kecamatan == id_kecamatan).first()
    if not k:
        raise HTTPException(status_code=404, detail="Kecamatan tidak ditemukan")
    return {
        "id_kecamatan":   k.id_kecamatan,
        "nama_kecamatan": k.nama_kecamatan,
        "geometry":       geom_to_geojson(k.geom_polygon),
    }
