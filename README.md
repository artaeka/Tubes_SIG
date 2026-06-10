# WebGIS Sistem Informasi Rute Angkutan Umum AKDP Kabupaten Tulungagung

> Berkas dokumentasi teknis ini disusun sebagai syarat pemenuhan tugas proyek akhir mata kuliah **Sistem Informasi Geografis (SIG)** Semester Genap 2025/2026, Program Studi Teknik Informatika, Institut Teknologi Sumatera (ITERA).

---

### 👥 Kelompok 10 - "TulangTulung"

| Nama Anggota | NIM |
| :--- | :--- |
| **Mekar Cendra Narwastu** | 123140074 |
| **Mei Disti Ayuningtias** | 123140076 |
| **Sahiva Syamdo Vinoza** | 123140194 |
| **Arta Eka Yuly Rajagukguk** | 123140209 |

* **Dosen Pengampu:** 
  * Muhammad Habib Algifari, S.Kom., M.T.I.
  * Alya Khairunnisa Rizkita, S.Kom., M.Kom.

---

## 📌 Deskripsi Proyek
Aplikasi WebGIS Rute Angkutan Antar Kota Dalam Provinsi (AKDP) Kabupaten Tulungagung adalah sebuah platform pemetaan interaktif dinamis yang menyajikan informasi spasial jalur trayek (*MultiLineString*) dan sebaran halte (*Point*) secara real-time. 

Sistem ini mengimplementasikan analisis spasial GIS tingkat lanjut menggunakan ekstensi basis data **PostgreSQL/PostGIS** untuk menghitung parameter jarak geografis akurat di atas proyeksi koordinat **SRID 4326 (WGS 84)**.

---

## ⚡ Fitur Utama Sistem

1. **Visualisasi Spasial Multi-Layer:** 
   * Merender garis lintasan trayek (*MultiLineString*) dengan warna berbeda berdasarkan jenis angkutan (AKDP, Angkot, Bus Sekolah).
   * Merender penanda halte (*Point*) menggunakan ikon bus dinamis.
   * Toggle visualisasi densitas kepadatan lalu lintas pada jalur-jalur pusat kota Tulungagung.

2. **Pencarian Cerdas & Auto-FlyTo:**
   * Kotak pencarian sidebar yang menyaring rute atau halte secara real-time.
   * Ketika hasil pencarian diklik, kamera peta otomatis melakukan pergeseran mulus (*smooth flyTo/fitBounds*) langsung memusat di atas objek spasial tersebut, sekaligus menyembunyikan rute lainnya agar fokus.

3. **Kueri Analisis Spasial (PostGIS):**
   * **Analisis Radius Spasial (`ST_DWithin`):** Klik kiri di mana saja pada area peta untuk menggambar jangkauan radius lingkaran meter spasial dan menampilkan daftar halte yang berada di dalam area radius tersebut secara real-time.
   * **Kueri Rute Terdekat (`ST_Distance`):** Menemukan lintasan rute terdekat dari koordinat klik kursor pengguna dan mengukur jarak offset-nya dalam satuan meter.

4. **Dashboard Pengelolaan Admin (CRUD Spasial):**
   * Halaman kelola admin yang dilindungi oleh otentikasi token JWT (Bearer Token).
   * Melakukan manipulasi data (Tambah, Edit, Hapus) kordinat spasial koordinat rute (*MultiLineString*) dan halte (*Point*).
   * Mengubah status operasional rute (*Aktif, Maintenance, atau Nonaktif*) secara real-time ke database PostgreSQL.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

* **Database Spasial:** PostgreSQL 16+ & PostGIS Extension (ST_DWithin, ST_Distance, ST_Multi, ST_GeomFromText)
* **Backend Framework:** FastAPI (Python 3.10+) & GeoAlchemy2 ORM
* **Frontend Framework:** ReactJS (Vite & Tailwind CSS)
* **Map Library:** LeafletJS & React-Leaflet
* **Gateway Layer (BFF):** Node.js / Express.js (Port 3000)

---

## 🚀 Panduan Instalasi & Menjalankan Proyek Lokal

### **Langkah 1: Konfigurasi Database (PostgreSQL/PostGIS)**
1. Pastikan PostgreSQL 16+ dan ekstensi PostGIS telah terpasang di komputer Anda.
2. Buat database baru di pgAdmin 4 bernama **`Webgis_tulungagung`**.
3. Buka **Query Tool** pada database tersebut, lalu jalankan perintah aktivasi ekstensi PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Jalankan seluruh perintah di dalam berkas **`database.sql`** yang ada di folder root proyek Anda melalui Query Tool pgAdmin untuk membuat tabel-tabel spasial dan memasukkan 20 data sampel Tulungagung secara otomatis.

### **Langkah 2: Menjalankan Backend (FastAPI - Port 8000)**
1. Buka terminal baru, lalu masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat dan aktifkan *virtual environment* Python Anda:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Pasang seluruh pustaka Python yang dibutuhkan:
   ```bash
   pip install -r requirements.txt
   ```
4. Daftarkan akun administrator resmi ke dalam database PostgreSQL menggunakan berkas seeding:
   ```bash
   python seed_admin.py
   ```
5. Jalankan server backend FastAPI:
   ```bash
   uvicorn app.main:app --reload
   ```
   * *Akses dokumentasi Swagger REST API di alamat:* `http://localhost:8000/docs`

### **Langkah 3: Menjalankan Frontend & Gateway (React & Express - Port 3000)**
1. Buka terminal baru di VS Code, lalu masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Pasang seluruh modul Node.js yang dibutuhkan:
   ```bash
   npm install
   ```
3. Jalankan server gerbang integrasi (*WebGIS Gateway & Vite*):
   ```bash
   npm run dev
   ```
4. Buka browser Anda dan akses aplikasi di alamat:
   👉 **`http://localhost:3000`**

---

## 📋 Struktur Berkas Utama Proyek

```
AKDP-TulungAgung/
│
├── backend/                  # Layanan Backend REST API (FastAPI)
│   ├── app/
│   │   ├── routers/          # Modul router (rute, transportasi, kecamatan, auth)
│   │   ├── utils/            # Utilitas konversi spasial & otentikasi
│   │   ├── database.py       # Konfigurasi koneksi SQLAlchemy
│   │   ├── models.py         # Skema tabel fisik PostgreSQL/PostGIS
│   │   ├── schemas.py        # Skema validasi Pydantic v2
│   │   └── main.py           # File inisialisasi aplikasi FastAPI
│   ├── requirements.txt      # Daftar pustaka Python backend
│   └── seed_admin.py         # Script seeding akun admin ke database
│
├── frontend/                 # Layanan Frontend (Vite React & Express BFF Gateway)
│   ├── src/
│   │   ├── components/       # Komponen visual (Peta Leaflet, Beranda, Kelola Admin)
│   │   ├── App.jsx           # Kontrol perutean tab dinamis
│   │   ├── main.jsx          # Titik masuk React
│   │   ├── types.ts          # Definisi interface TypeScript
│   │   └── index.css         # Styling kustom & Tailwind kompilasi
│   ├── package.json          # Script eksekusi dan dependensi Node
│   ├── server.ts             # BFF Gateway Express (Port 3000)
│   └── vite.config.ts        # Konfigurasi bundler Vite
│
└── database.sql              # Berkas SQL Dump database Tulungagung riil
```