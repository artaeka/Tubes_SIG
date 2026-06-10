"""
Router: Layers — daftar layer peta yang tersedia untuk frontend Leaflet
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/layers", tags=["Layers"])


@router.get("/", summary="Daftar layer peta yang tersedia")
def get_layers(db: Session = Depends(get_db)):
    """
    Mengembalikan metadata layer yang bisa diaktifkan/dimatikan
    pada peta Leaflet di frontend.
    """
    jumlah_rute    = db.query(models.RuteAKDP).count()
    jumlah_titik   = db.query(models.TitikTransportasi).count()
    jumlah_fasilitas = db.query(models.FasilitasUmum).count()
    jumlah_kecamatan = db.query(models.Kecamatan).count()

    return {
        "layers": [
            {
                "id":          "rute_akdp",
                "nama":        "Rute AKDP",
                "deskripsi":   "Jalur angkutan umum antar kota dalam provinsi",
                "geojson_url": "/api/rute/geojson",
                "jumlah_data": jumlah_rute,
                "aktif":       True,
                "warna":       "#e74c3c",
                "tipe":        "linestring",
            },
            {
                "id":          "titik_transportasi",
                "nama":        "Terminal & Halte",
                "deskripsi":   "Terminal, halte, dan titik naik-turun penumpang",
                "geojson_url": "/api/titik-transportasi/geojson",
                "jumlah_data": jumlah_titik,
                "aktif":       True,
                "warna":       "#2980b9",
                "tipe":        "point",
            },
            {
                "id":          "fasilitas_umum",
                "nama":        "Fasilitas Umum",
                "deskripsi":   "Pasar, sekolah, rumah sakit, dan fasilitas lainnya",
                "geojson_url": "/api/fasilitas-umum/geojson",
                "jumlah_data": jumlah_fasilitas,
                "aktif":       False,
                "warna":       "#27ae60",
                "tipe":        "point",
            },
            {
                "id":          "kecamatan",
                "nama":        "Batas Kecamatan",
                "deskripsi":   "Batas administrasi kecamatan Kabupaten Tulungagung",
                "geojson_url": "/api/kecamatan/geojson",
                "jumlah_data": jumlah_kecamatan,
                "aktif":       False,
                "warna":       "#8e44ad",
                "tipe":        "polygon",
            },
        ]
    }
