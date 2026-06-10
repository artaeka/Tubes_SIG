-- 1. Aktifkan Ekstensi PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Bersihkan tabel lama jika sebelumnya sudah ada (menghindari error)
DROP TABLE IF EXISTS rute_titik CASCADE;
DROP TABLE IF EXISTS fasilitas_umum CASCADE;
DROP TABLE IF EXISTS titik_transportasi CASCADE;
DROP TABLE IF EXISTS rute_akdp CASCADE;
DROP TABLE IF EXISTS kecamatan CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PEMBUATAN TABEL SESUAI STRUKTUR MODELS.PY
-- ═══════════════════════════════════════════════════════════════════════════════

-- Tabel 1: Users
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 2: Kecamatan (Menggunakan MULTIPOLYGON sesuai models.py)
CREATE TABLE kecamatan (
    id_kecamatan SERIAL PRIMARY KEY,
    nama_kecamatan VARCHAR(100) NOT NULL,
    geom_polygon GEOMETRY(MultiPolygon, 4326)
);

-- Tabel 3: Rute AKDP (Menggunakan MULTILINESTRING sesuai models.py)
CREATE TABLE rute_akdp (
    id_rute SERIAL PRIMARY KEY,
    nama_trayek VARCHAR(150) NOT NULL,
    kode_trayek VARCHAR(50),
    titik_awal VARCHAR(150),
    titik_akhir VARCHAR(150),
    jenis_angkutan VARCHAR(100),
    jalur_dilalui VARCHAR(500),
    panjang_rute FLOAT,
    waktu_tempuh VARCHAR(50),
    jam_operasional VARCHAR(100),
    tarif FLOAT,
    status_rute BOOLEAN DEFAULT TRUE,
    geom_linestring GEOMETRY(MultiLineString, 4326)
);

-- Tabel 4: Titik Transportasi (Menggunakan POINT sesuai models.py)
CREATE TABLE titik_transportasi (
    id_titik SERIAL PRIMARY KEY,
    nama_titik VARCHAR(150) NOT NULL,
    jenis_titik VARCHAR(50),
    alamat VARCHAR(255),
    geom_point GEOMETRY(Point, 4326)
);

-- Tabel 5: Rute Titik (Tabel jembatan/relasi rute <-> titik)
CREATE TABLE rute_titik (
    id_rute_titik SERIAL PRIMARY KEY,
    id_rute INTEGER REFERENCES rute_akdp(id_rute) ON DELETE CASCADE,
    id_titik INTEGER REFERENCES titik_transportasi(id_titik) ON DELETE CASCADE,
    urutan INTEGER
);

-- Tabel 6: Fasilitas Umum (Menggunakan POINT sesuai models.py)
CREATE TABLE fasilitas_umum (
    id_fasilitas SERIAL PRIMARY KEY,
    nama_fasilitas VARCHAR(150) NOT NULL,
    jenis_fasilitas VARCHAR(100),
    alamat VARCHAR(255),
    geom_point GEOMETRY(Point, 4326)
);

-- Membuat Indeks Spasial (GiST) untuk optimalisasi query PostGIS
CREATE INDEX idx_kecamatan_geom ON kecamatan USING gist (geom_polygon);
CREATE INDEX idx_rute_geom ON rute_akdp USING gist (geom_linestring);
CREATE INDEX idx_titik_geom ON titik_transportasi USING gist (geom_point);
CREATE INDEX idx_fasilitas_geom ON fasilitas_umum USING gist (geom_point);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PENGISIAN DATA SAMPEL (DENGAN KOORDINAT TULUNGAGUNG RIIL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- B. Data Kecamatan (12 record MultiPolygon, diubah via ST_Multi dari Polygon)
INSERT INTO kecamatan (nama_kecamatan, geom_polygon) VALUES
('Kecamatan Tulungagung', ST_Multi(ST_GeomFromText('POLYGON((111.890 -8.070, 111.910 -8.070, 111.910 -8.050, 111.890 -8.050, 111.890 -8.070))', 4326))),
('Kecamatan Kedungwaru', ST_Multi(ST_GeomFromText('POLYGON((111.890 -8.050, 111.920 -8.050, 111.920 -8.020, 111.890 -8.020, 111.890 -8.050))', 4326))),
('Kecamatan Boyolangu', ST_Multi(ST_GeomFromText('POLYGON((111.890 -8.110, 111.920 -8.110, 111.920 -8.070, 111.890 -8.070, 111.890 -8.110))', 4326))),
('Kecamatan Kauman', ST_Multi(ST_GeomFromText('POLYGON((111.830 -8.080, 111.870 -8.080, 111.870 -8.050, 111.830 -8.050, 111.830 -8.080))', 4326))),
('Kecamatan Gondang', ST_Multi(ST_GeomFromText('POLYGON((111.780 -8.100, 111.830 -8.100, 111.830 -8.070, 111.780 -8.070, 111.780 -8.100))', 4326))),
('Kecamatan Campurdarat', ST_Multi(ST_GeomFromText('POLYGON((111.830 -8.170, 111.880 -8.170, 111.880 -8.130, 111.830 -8.130, 111.830 -8.170))', 4326))),
('Kecamatan Ngunut', ST_Multi(ST_GeomFromText('POLYGON((111.970 -8.130, 112.030 -8.130, 112.030 -8.090, 111.970 -8.090, 111.970 -8.130))', 4326))),
('Kecamatan Rejotangan', ST_Multi(ST_GeomFromText('POLYGON((112.030 -8.140, 112.080 -8.140, 112.080 -8.100, 112.030 -8.100, 112.030 -8.140))', 4326))),
('Kecamatan Bandung', ST_Multi(ST_GeomFromText('POLYGON((111.750 -8.200, 111.810 -8.200, 111.810 -8.160, 111.750 -8.160, 111.750 -8.200))', 4326))),
('Kecamatan Besuki', ST_Multi(ST_GeomFromText('POLYGON((111.750 -8.250, 111.810 -8.250, 111.810 -8.200, 111.750 -8.200, 111.750 -8.250))', 4326))),
('Kecamatan Pakel', ST_Multi(ST_GeomFromText('POLYGON((111.800 -8.160, 111.850 -8.160, 111.850 -8.120, 111.800 -8.120, 111.800 -8.160))', 4326))),
('Kecamatan Sumbergempol', ST_Multi(ST_GeomFromText('POLYGON((111.920 -8.110, 111.960 -8.110, 111.960 -8.070, 111.920 -8.070, 111.920 -8.110))', 4326)));

-- C. Data Titik Transportasi (20 record Point Halte asli Tulungagung)
INSERT INTO titik_transportasi (nama_titik, jenis_titik, alamat, geom_point) VALUES
('Halte Stasiun Utama', 'halte', 'Jl. Pangeran Antasari, Tulungagung', ST_GeomFromText('POINT(111.9031 -8.0583)', 4326)),
('Halte Pasar Wage', 'halte', 'Jl. Jenderal Sudirman, Tulungagung', ST_GeomFromText('POINT(111.9042 -8.0556)', 4326)),
('Halte Terminal Gayatri', 'halte', 'Jl. Yos Sudarso, Tulungagung', ST_GeomFromText('POINT(111.9054 -8.0621)', 4326)),
('Halte Kauman', 'halte', 'Jl. Raya Kauman, Kauman', ST_GeomFromText('POINT(111.8550 -8.0682)', 4326)),
('Halte Ngunut', 'halte', 'Jl. Raya Ngunut, Ngunut', ST_GeomFromText('POINT(111.9821 -8.1121)', 4326)),
('Halte Rejotangan', 'halte', 'Jl. Raya Rejotangan, Rejotangan', ST_GeomFromText('POINT(112.0621 -8.1215)', 4326)),
('Halte Campurdarat', 'halte', 'Jl. Raya Campurdarat, Campurdarat', ST_GeomFromText('POINT(111.8592 -8.1553)', 4326)),
('Halte Bandung', 'halte', 'Jl. Raya Bandung, Bandung', ST_GeomFromText('POINT(111.7821 -8.1820)', 4326)),
('Halte Besuki', 'halte', 'Jl. Raya Besuki, Besuki', ST_GeomFromText('POINT(111.7921 -8.2321)', 4326)),
('Halte Pakel', 'halte', 'Jl. Raya Pakel, Pakel', ST_GeomFromText('POINT(111.8152 -8.1451)', 4326)),
('Halte Sumbergempol', 'halte', 'Jl. Raya Sumbergempol, Sumbergempol', ST_GeomFromText('POINT(111.9423 -8.0850)', 4326)),
('Halte Boyolangu', 'halte', 'Jl. Raya Boyolangu, Boyolangu', ST_GeomFromText('POINT(111.9012 -8.0991)', 4326)),
('Halte Tulungagung Kota', 'halte', 'Pusat Kota Tulungagung', ST_GeomFromText('POINT(111.9015 -8.0662)', 4326)),
('Halte Kedungwaru', 'halte', 'Jl. Raya Kedungwaru, Kedungwaru', ST_GeomFromText('POINT(111.9095 -8.0483)', 4326)),
('Halte Karangrejo', 'halte', 'Jl. Raya Karangrejo, Karangrejo', ST_GeomFromText('POINT(111.8921 -8.0125)', 4326)),
('Halte Sendang', 'halte', 'Jl. Raya Sendang, Sendang', ST_GeomFromText('POINT(111.7820 -7.9551)', 4326)),
('Halte Kalidawir', 'halte', 'Jl. Raya Kalidawir, Kalidawir', ST_GeomFromText('POINT(111.9825 -8.1754)', 4326)),
('Halte Pucanglaban', 'halte', 'Jl. Raya Pucanglaban, Pucanglaban', ST_GeomFromText('POINT(112.0120 -8.2120)', 4326)),
('Halte Tanggunggunung', 'halte', 'Jl. Raya Tanggunggunung, Tanggunggunung', ST_GeomFromText('POINT(111.9010 -8.2250)', 4326)),
('Halte Gondang', 'halte', 'Jl. Raya Gondang, Gondang', ST_GeomFromText('POINT(111.8021 -8.0854)', 4326));

-- D. Data Rute AKDP (20 record MultiLineString - Memenuhi batas minimal tugas besar)
INSERT INTO rute_akdp (nama_trayek, kode_trayek, titik_awal, titik_akhir, jenis_angkutan, jalur_dilalui, panjang_rute, waktu_tempuh, jam_operasional, tarif, status_rute, geom_linestring) VALUES
('Trayek Stasiun - Pasar', 'TR-01', 'Stasiun Tulungagung', 'Pasar Wage', 'Angkot', 'Jl. Antasari - Jl. Sudirman', 2.5, '10 menit', '06:00 - 17:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9031 -8.0583, 111.9042 -8.0556)', 4326))),
('Trayek Gayatri - Ngunut', 'TR-02', 'Terminal Gayatri', 'Halte Ngunut', 'Bus Medium', 'Jl. Yos Sudarso - Ngrowo - Ngunut', 12.0, '25 menit', '05:00 - 18:00', 8000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9054 -8.0621, 111.9015 -8.0662, 111.9095 -8.0483, 111.9821 -8.1121)', 4326))),
('Trayek Rejotangan - Campurdarat', 'TR-03', 'Halte Rejotangan', 'Halte Campurdarat', 'Angkot', 'Rejotangan - Ngunut - Campurdarat', 21.0, '45 menit', '06:00 - 15:00', 12000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(112.0621 -8.1215, 111.9821 -8.1121, 111.9423 -8.0850, 111.9012 -8.0991, 111.8592 -8.1553)', 4326))),
('Trayek Bandung - Besuki', 'TR-04', 'Halte Bandung', 'Halte Besuki', 'Angkot', 'Bandung - Besuki Utama', 10.5, '20 menit', '06:00 - 16:00', 6000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.7821 -8.1820, 111.7921 -8.2321)', 4326))),
('Trayek Pakel - Sumbergempol', 'TR-05', 'Halte Pakel', 'Halte Sumbergempol', 'Angkot', 'Pakel - Sumbergempol Tengah', 15.0, '35 menit', '06:00 - 15:00', 8000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.8152 -8.1451, 111.9423 -8.0850)', 4326))),
('Trayek Gondang - Kauman', 'TR-06', 'Halte Gondang', 'Halte Kauman', 'Angkot', 'Gondang Raya - Kauman', 8.5, '15 menit', '06:00 - 17:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.8021 -8.0854, 111.8550 -8.0682)', 4326))),
('Trayek Kedungwaru - Ngantru', 'TR-07', 'Halte Kedungwaru', 'Halte Ngantru', 'MPU', 'Kedungwaru - Jembatan Ngantru', 5.0, '12 menit', '06:00 - 18:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9095 -8.0483, 111.9211 -8.0210)', 4326))),
('Trayek Boyolangu - Campurdarat', 'TR-08', 'Halte Boyolangu', 'Halte Campurdarat', 'Angkot', 'Boyolangu - Campurdarat Selatan', 9.0, '20 menit', '06:00 - 16:00', 6000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9012 -8.0991, 111.8592 -8.1553)', 4326))),
('Trayek Tulungagung Kota - Sendang', 'TR-09', 'Halte Tulungagung Kota', 'Halte Sendang', 'Bus Medium', 'Kota - Kauman - Sendang', 25.0, '55 menit', '05:30 - 17:00', 15000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9015 -8.0662, 111.8550 -8.0682, 111.7820 -7.9551)', 4326))),
('Trayek Karangrejo - Pagerwojo', 'TR-10', 'Halte Karangrejo', 'Halte Pagerwojo', 'Angkot', 'Karangrejo - Pagerwojo Pegunungan', 22.0, '50 menit', '06:00 - 15:00', 12000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.8921 -8.0125, 111.7654 -8.0125)', 4326))),
('Trayek Kalidawir - Pucanglaban', 'TR-11', 'Halte Kalidawir', 'Halte Pucanglaban', 'Angkot', 'Kalidawir - Pucanglaban Pantai', 18.2, '40 menit', '06:00 - 15:00', 10000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9825 -8.1754, 112.0120 -8.2120)', 4326))),
('Trayek Tanggunggunung - Besuki', 'TR-12', 'Halte Tanggunggunung', 'Halte Besuki', 'Angkot', 'Tanggunggunung - Besuki Selatan', 14.5, '35 menit', '06:00 - 15:30', 8000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9010 -8.2250, 111.7921 -8.2321)', 4326))),
('Trayek Sumbergempol - Ngunut', 'TR-13', 'Halte Sumbergempol', 'Halte Ngunut', 'Angkot', 'Sumbergempol - Ngunut Timur', 8.2, '18 menit', '06:00 - 17:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9423 -8.0850, 111.9821 -8.1121)', 4326))),
('Trayek Boyolangu - Kalidawir', 'TR-14', 'Halte Boyolangu', 'Halte Kalidawir', 'MPU', 'Boyolangu - Kalidawir', 16.5, '35 menit', '06:00 - 16:00', 9000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9012 -8.0991, 111.9825 -8.1754)', 4326))),
('Trayek Kauman - Gondang', 'TR-15', 'Halte Kauman', 'Halte Gondang', 'Feeder', 'Kauman - Gondang Barat', 8.5, '15 menit', '06:00 - 17:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.8550 -8.0682, 111.8021 -8.0854)', 4326))),
('Trayek Ngantru - Karangrejo', 'TR-16', 'Halte Ngantru', 'Halte Karangrejo', 'Feeder', 'Ngantru - Karangrejo Utara', 10.2, '22 menit', '06:00 - 16:00', 6000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9211 -8.0210, 111.8921 -8.0125)', 4326))),
('Trayek Sendang - Pagerwojo', 'TR-17', 'Halte Sendang', 'Halte Pagerwojo', 'MPU', 'Sendang - Pagerwojo Utara', 24.5, '55 menit', '06:00 - 15:00', 15000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.7820 -7.9551, 111.7654 -8.0125)', 4326))),
('Trayek Pucanglaban - Tanggunggunung', 'TR-18', 'Halte Pucanglaban', 'Halte Tanggunggunung', 'Feeder', 'Lintas Pantai Selatan', 21.0, '45 menit', '06:00 - 15:00', 11000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(112.0120 -8.2120, 111.9010 -8.2250)', 4326))),
('Trayek Bandung - Pakel', 'TR-19', 'Halte Bandung', 'Halte Pakel', 'Feeder', 'Bandung - Pakel', 9.2, '20 menit', '06:00 - 17:00', 5000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.7821 -8.1820, 111.8152 -8.1451)', 4326))),
('Trayek Tulungagung Kota - Ngunut', 'TR-20', 'Halte Tulungagung Kota', 'Halte Ngunut', 'Bus Medium', 'Kota - Ngunut Bypass', 15.4, '30 menit', '05:00 - 18:00', 10000.00, TRUE, ST_Multi(ST_GeomFromText('LINESTRING(111.9015 -8.0662, 111.9821 -8.1121)', 4326)));

-- E. Data Relasi Rute-Titik (RuteTitik)
INSERT INTO rute_titik (id_rute, id_titik, urutan) VALUES
-- Rute 1
(1, 1, 1), (1, 2, 2),
-- Rute 2
(2, 3, 1), (2, 13, 2), (2, 14, 3), (2, 5, 4),
-- Rute 3
(3, 6, 1), (3, 5, 2), (3, 11, 3), (3, 12, 4), (3, 7, 5),
-- Rute 4
(4, 8, 1), (4, 9, 2),
-- Rute 5
(5, 10, 1), (5, 11, 2),
-- Rute 6
(6, 20, 1), (6, 4, 2),
-- Rute 7
(7, 14, 1), (7, 11, 2),
-- Rute 8
(8, 12, 1), (8, 7, 2),
-- Rute 9
(9, 13, 1), (9, 4, 2), (9, 16, 3),
-- Rute 10
(10, 15, 1), (10, 14, 2),
-- Rute 11
(11, 17, 1), (11, 18, 2),
-- Rute 12
(12, 19, 1), (12, 9, 2),
-- Rute 13
(13, 11, 1), (13, 5, 2),
-- Rute 14
(14, 12, 1), (14, 17, 2),
-- Rute 15
(15, 4, 1), (15, 20, 2),
-- Rute 16
(16, 11, 1), (16, 15, 2),
-- Rute 17
(17, 16, 1), (17, 14, 2),
-- Rute 18
(18, 18, 1), (18, 19, 2),
-- Rute 19
(19, 8, 1), (19, 10, 2),
-- Rute 20
(20, 13, 1), (20, 5, 2);

-- F. Data Fasilitas Umum (20 record Point asli Tulungagung)
INSERT INTO fasilitas_umum (nama_fasilitas, jenis_fasilitas, alamat, geom_point) VALUES
('RSUD Dr. Iskak Tulungagung', 'Rumah Sakit', 'Jl. Dr. Wahidin Sudirohusodo', ST_GeomFromText('POINT(111.9125 -8.0521)', 4326)),
('UIN Sayyid Ali Rahmatullah (UIN SATU)', 'Kampus', 'Jl. Mayor Sujadi No. 46, Plosokandang', ST_GeomFromText('POINT(111.9161 -8.0825)', 4326)),
('Alun-Alun Tulungagung', 'Taman Kota', 'Jl. Ahmad Yani, Tulungagung', ST_GeomFromText('POINT(111.9015 -8.0662)', 4326)),
('Apollo Supermall', 'Pusat Perbelanjaan', 'Jl. Pangeran Diponegoro, Tulungagung', ST_GeomFromText('POINT(111.9011 -8.0601)', 4326)),
('Kampung Susu Dinasty', 'Wisata Edukasi', 'Jl. Raya Sidem, Boyolangu', ST_GeomFromText('POINT(111.9032 -8.1121)', 4326)),
('Candi Gayatri', 'Situs Sejarah', 'Kecamatan Boyolangu, Tulungagung', ST_GeomFromText('POINT(111.9112 -8.1154)', 4326)),
('Candi Dadi', 'Situs Sejarah', 'Kecamatan Boyolangu, Tulungagung', ST_GeomFromText('POINT(111.9212 -8.1521)', 4326)),
('Pasar Ngemplak', 'Pasar Tradisional', 'Jl. KH. Abdul Fattah, Tulungagung', ST_GeomFromText('POINT(111.9055 -8.0512)', 4326)),
('RS Bhayangkara Tulungagung', 'Rumah Sakit', 'Jl. Jenderal Sudirman No. 12', ST_GeomFromText('POINT(111.9021 -8.0545)', 4326)),
('STKIP PGRI Tulungagung', 'Kampus', 'Jl. Mayor Sujadi Timur No. 7', ST_GeomFromText('POINT(111.9152 -8.0754)', 4326)),
('Universitas Tulungagung (UNITA)', 'Kampus', 'Jl. Raya Kedungwaru', ST_GeomFromText('POINT(111.9184 -8.0425)', 4326)),
('SMK Negeri 3 Tulungagung', 'Sekolah', 'Jl. Mayor Sujadi No. 100', ST_GeomFromText('POINT(111.9115 -8.0882)', 4326)),
('SMA Negeri 1 Tulungagung', 'Sekolah', 'Jl. Ki Hajar Dewantara', ST_GeomFromText('POINT(111.9082 -8.0461)', 4326)),
('Kantor Bupati Tulungagung', 'Pemerintahan', 'Jl. Ahmad Yani No. 37', ST_GeomFromText('POINT(111.9022 -8.0652)', 4326)),
('Taman Kali Ngrowo', 'Taman Kota', 'Sisi Barat Sungai Ngrowo, Tulungagung', ST_GeomFromText('POINT(111.9075 -8.0572)', 4326)),
('Masjid Al-Munawar', 'Rumah Ibadah', 'Sisi Barat Alun-Alun Tulungagung', ST_GeomFromText('POINT(111.9001 -8.0671)', 4326)),
('Klenteng Tjoe Tik Bio', 'Rumah Ibadah', 'Jl. Wage Rudolf Supratman', ST_GeomFromText('POINT(111.9045 -8.0691)', 4326)),
('Hutan Kota Tulungagung', 'Taman Kota', 'Kecamatan Kedungwaru', ST_GeomFromText('POINT(111.9221 -8.0454)', 4326)),
('RS Prima Medika', 'Rumah Sakit', 'Jl. Raya Kadipaten', ST_GeomFromText('POINT(111.9182 -8.0552)', 4326)),
('Gedung Olahraga Lembu Peteng', 'Gedung Olahraga', 'Jl. Soekarno-Hatta, Tulungagung', ST_GeomFromText('POINT(111.8851 -8.0682)', 4326));

ALTER TABLE public.rute_akdp 
ALTER COLUMN status_rute TYPE VARCHAR(50) 
USING CASE WHEN status_rute THEN 'Aktif' ELSE 'Nonaktif' END;