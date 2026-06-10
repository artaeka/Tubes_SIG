from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from .database import Base


class User(Base):
    __tablename__ = "users"

    id_user     = Column(Integer, primary_key=True, index=True)
    nama        = Column(String(100), nullable=False)
    email       = Column(String(100), unique=True, nullable=False)
    password    = Column(String(255), nullable=False)
    role        = Column(String(20), default="admin")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class RuteAKDP(Base):
    __tablename__ = "rute_akdp"

    id_rute          = Column(Integer, primary_key=True, index=True)
    nama_trayek      = Column(String(150), nullable=False)
    kode_trayek      = Column(String(50))
    titik_awal       = Column(String(150))
    titik_akhir      = Column(String(150))
    jenis_angkutan   = Column(String(100))
    jalur_dilalui    = Column(String(500))
    panjang_rute     = Column(Float)          # km
    waktu_tempuh     = Column(String(50))     # contoh: "45 menit"
    jam_operasional  = Column(String(100))    # contoh: "05:00 - 18:00"
    tarif            = Column(Float)          # rupiah
    status_rute      = Column(String(50), default="Aktif")
    geom_linestring  = Column(Geometry(geometry_type="MULTILINESTRING", srid=4326))

    # relasi ke rute_titik
    titik_list = relationship("RuteTitik", back_populates="rute", cascade="all, delete-orphan")


class TitikTransportasi(Base):
    __tablename__ = "titik_transportasi"

    id_titik    = Column(Integer, primary_key=True, index=True)
    nama_titik  = Column(String(150), nullable=False)
    jenis_titik = Column(String(50))   # terminal / halte / sub-terminal
    alamat      = Column(String(255))
    geom_point  = Column(Geometry(geometry_type="POINT", srid=4326))

    # relasi ke rute_titik
    rute_list = relationship("RuteTitik", back_populates="titik")


class RuteTitik(Base):
    """Tabel jembatan: rute ↔ titik transportasi"""
    __tablename__ = "rute_titik"

    id_rute_titik = Column(Integer, primary_key=True, index=True)
    id_rute       = Column(Integer, ForeignKey("rute_akdp.id_rute", ondelete="CASCADE"))
    id_titik      = Column(Integer, ForeignKey("titik_transportasi.id_titik", ondelete="CASCADE"))
    urutan        = Column(Integer)   # urutan pemberhentian di dalam rute

    rute  = relationship("RuteAKDP", back_populates="titik_list")
    titik = relationship("TitikTransportasi", back_populates="rute_list")


class Kecamatan(Base):
    __tablename__ = "kecamatan"

    id_kecamatan   = Column(Integer, primary_key=True, index=True)
    nama_kecamatan = Column(String(100), nullable=False)
    geom_polygon   = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326))


class FasilitasUmum(Base):
    __tablename__ = "fasilitas_umum"

    id_fasilitas    = Column(Integer, primary_key=True, index=True)
    nama_fasilitas  = Column(String(150), nullable=False)
    jenis_fasilitas = Column(String(100))  # pasar / sekolah / rumah sakit / dll
    alamat          = Column(String(255))
    geom_point      = Column(Geometry(geometry_type="POINT", srid=4326))