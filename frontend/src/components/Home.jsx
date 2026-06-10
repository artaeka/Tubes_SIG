import React from "react";

export default function Home({ setTab, isAdmin }) {
  return (
    <div className="flex-1 flex flex-col select-none hero-pattern overflow-y-auto">
      <div className="max-w-[1440px] mx-auto w-full px-gutter py-xl flex-1 space-y-xl">
        
        <div className="bg-white rounded-3xl border border-outline-variant shadow-lg p-lg md:p-xl flex flex-col lg:flex-row items-center gap-xl relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/[0.02] -skew-x-12 pointer-events-none"></div>

          <div className="flex-1 space-y-md z-10">
            <div className="inline-flex items-center gap-xs bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[10px] font-sans font-extrabold uppercase tracking-widest">
              <span className="material-icons-outlined text-[13px] animate-pulse">radar</span>
              GIS Portal Aktif
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
              Aman, Terkoneksi, dan Nyaman Menjelajah <span className="text-primary">Tulungagung</span>
            </h1>

            <p className="text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
              Selamat datang di WebGIS Resmi Dinas Perhubungan Kabupaten Tulungagung. 
              Sistem Informasi Geografis interaktif ini dirancang khusus untuk memetakan, 
              menganalisis konektivitas regional, menghitung estimasi radius spasial antar halte, serta mendata trayek angkutan umum (AKDP, Angkot, & Bus Sekolah) secara real-time.
            </p>

            <div className="flex flex-wrap items-center gap-sm pt-4">
              <button
                type="button"
                onClick={() => setTab("map")}
                className="bg-primary text-on-primary font-bold px-xl py-sm.5 rounded-xl text-body-md hover:bg-opacity-95 hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-icons-outlined text-medium">explore</span>
                Buka Peta WebGIS
              </button>
              <button
                type="button"
                onClick={() => setTab("detail")}
                className="bg-white border border-outline text-primary font-bold px-lg py-sm.5 rounded-xl text-body-md hover:bg-surface-container-low transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span className="material-icons-outlined text-sm">alt_route</span>
                Cari Info rute
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-[480px] w-full z-10 shrink-0 block">
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant shadow-2xl skew-y-1">
              <img
                src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"
                alt="Peta Spasial Bus Tulungagung"
                className="w-full aspect-[4/3] object-cover filter brightness-95 saturation-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono shadow-md border border-outline-variant text-primary font-bold flex items-center gap-1">
                <span className="material-icons-outlined text-sm">map</span>
                EPSG:4326 PostGIS Active
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-sm text-left">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-mono text-outline font-black tracking-widest uppercase block">
              TULUNGAGUNG REGIONAL CONNECTIVITY IN NUMBERS
            </span>
            <h2 className="font-display text-2xl font-extrabold text-on-surface tracking-tight mt-1">
              Statistik Jaringan Transportasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {[
              { num: "20+", label: "Rute Terdaftar", desc: "Trayek AKDP, Angkot, & Bus Sekolah", icon: "alt_route", color: "bg-primary-fixed text-on-primary-fixed" },
              { num: "24", label: "Halte Tersebar", desc: "Titik shelter terdata spasial", icon: "storefront", color: "bg-secondary-container/80 text-black" },
              { num: "244 KM", label: "Total Jangkauan", desc: "Panjang LineString terlayani", icon: "query_stats", color: "bg-tertiary-fixed text-on-primary-fixed" },
              { num: "8", label: "Kecamatan Utama", desc: "Cakupan integrasi perbatasan", icon: "map", color: "bg-primary-fixed-dim text-on-primary-fixed" }
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-lg rounded-2xl border border-outline-variant shadow-sm flex items-center gap-md hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-xl ${stat.color} shrink-0`}>
                  <span className="material-icons-outlined text-xl font-bold block">{stat.icon}</span>
                </div>
                <div>
                  <span className="text-2xl font-display font-extrabold text-on-surface block tracking-tight">
                    {stat.num}
                  </span>
                  <p className="text-xs font-bold text-on-surface">{stat.label}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-left">
          <div className="bg-white rounded-3xl border border-outline-variant shadow-sm p-lg flex flex-col justify-between hover:shadow-lg hover:border-primary transition-all relative overflow-hidden group">
            <span className="material-icons-outlined text-primary text-3xl font-extrabold mb-4">radar</span>
            <div>
              <h3 className="font-display text-lg font-extrabold text-on-surface tracking-tight leading-snug">
                Eksplorasi Spasial Radius (ST_DWithin)
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                Gunakan kueri spasial relasional secara langsung pada peta interaktif. 
                Temukan halte-halte bus terdekat dalam jangkauan radius 500m s/d 5000m di sekitar RSUD Dr. Iskak, perkantoran, atau posisi GPS Anda saat ini secara cepat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab("map")}
              className="mt-6 w-full py-2.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-xl flex items-center justify-center gap-xs hover:bg-opacity-85 cursor-pointer"
            >
              Cari Halte Terdekat
              <span className="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant shadow-sm p-lg flex flex-col justify-between hover:shadow-lg hover:border-primary transition-all relative overflow-hidden group">
            <span className="material-icons-outlined text-secondary text-3xl font-extrabold mb-4">route</span>
            <div>
              <h3 className="font-display text-lg font-extrabold text-on-surface tracking-tight leading-snug">
                Estimasi Waktu & Relasi Jalur
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                Dapatkan informasi mendalam terkait rute perjalanan bus. 
                Cari tahu daftar jalan yang dilewati, taksiran waktu tempuh perjalanan, interval waktu antar armada bus, serta urutan shelter halte yang disinggahi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab("detail")}
              className="mt-6 w-full py-2.5 bg-secondary-container text-black text-xs font-bold rounded-xl flex items-center justify-center gap-xs hover:bg-opacity-85 cursor-pointer"
            >
              Buka Katalog Detail
              <span className="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant shadow-sm p-lg flex flex-col justify-between hover:shadow-lg hover:border-primary transition-all relative overflow-hidden group">
            <span className="material-icons-outlined text-tertiary text-3xl font-extrabold mb-4">admin_panel_settings</span>
            <div>
              <h3 className="font-display text-lg font-extrabold text-on-surface tracking-tight leading-snug">
                Registrasi & Manajemen Data Spasial
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                Disediakan khusus bagi administrator Dinas Perhubungan Kabupaten Tulungagung. 
                Mendukung insert koordinat Point Halte baru, modifikasi jalur trayek LineString, pengaturan jam penugasan, dan update status rute.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab(isAdmin ? "admin" : "login")}
              className="mt-6 w-full py-2.5 bg-tertiary-fixed text-on-primary-fixed text-xs font-bold rounded-xl flex items-center justify-center gap-xs hover:bg-opacity-85 cursor-pointer"
            >
              {isAdmin ? "Buka Admin Panel" : "Login Administrator"}
              <span className="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <section className="bg-surface-container-low p-md rounded-2xl border border-outline-variant flex flex-col md:flex-row items-center gap-md text-left">
          <span className="material-icons-outlined text-primary text-3xl shrink-0">info</span>
          <div className="space-y-1">
            <span className="text-[9px] font-mono bg-primary text-on-primary font-bold px-2 py-0.5 rounded uppercase font-black">PENGUMUMAN TRANSIT</span>
            <p className="text-xs font-bold text-on-surface">Pembangunan JLS (Jalur Lintas Selatan) & Integrasi Shelter Halte Tanggultor</p>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Dinas Perhubungan merencanakan penambahan 4 titik halte baru di sepanjang JLS Kecamatan Besuki guna menunjang akses alternatif wisata pantai terpadu pada kuartal depan.
            </p>
          </div>
        </section>

      </div>

      <footer className="mt-xxl bg-[#005dac] text-white py-lg px-gutter shrink-0">
        <div className="max-w-[1440px] mx-auto w-full space-y-md">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md text-xs text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-white text-xl">directions_bus</span>
                <span className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                  Sistem Informasi WebGIS Tulungagung
                </span>
              </div>
              <p className="text-white/85 text-[11px] leading-relaxed">
                Peta interaktif visualisasi jaringan transportasi umum, halte, dan konektivitas regional Kabupaten Tulungagung.
              </p>
            </div>

            <div className="md:text-right">
              <span className="font-bold text-white/90 uppercase text-[10px] tracking-wider block font-mono">
                Kelompok 10 - TulangTulung
              </span>
              <p className="text-white/60 text-[10px] mt-1">
                Dinas Perhubungan Kabupaten Tulungagung © 2026.
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-md text-center text-[11px] text-white/95">
            <p className="font-bold leading-relaxed tracking-wide flex flex-wrap justify-center gap-x-3 gap-y-1">
              <span>Mekar Cendra Narwastu</span>
              <span className="text-white/40">|</span>
              <span>Mei Disti Ayuningtias</span>
              <span className="text-white/40">|</span>
              <span>Sahiva Syamdo Vinoza</span>
              <span className="text-white/40">|</span>
              <span>Arta Eka Yuly Rajagukguk</span>
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}