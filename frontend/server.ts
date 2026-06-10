import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper untuk menyelaraskan tipe angkutan dari DB ke enum React
function mapJenisAngkutan(jenis: string | null | undefined): string {
  if (!jenis) return "AKDP";
  const j = String(jenis).toLowerCase();
  if (j.includes("angkot")) return "ANGKOT";
  if (j.includes("sekolah")) return "BUS_SEKOLAH";
  if (j.includes("feeder") || j.includes("shuttle")) return "BUS_SEKOLAH";
  if (j.includes("pedesaan")) return "PEDESAAN";
  if (j.includes("trans")) return "TRANS_TULUNGAGUNG";
  return "AKDP";
}

// Helper untuk menyelaraskan estimasi waktu tempuh secara dinamis
function parseDurationMin(waktuTempuh: string | null | undefined, distKm: number): number {
  if (waktuTempuh) {
    const match = String(waktuTempuh).match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  // Estimasi spasial: Kecepatan rata-rata angkutan 30km/jam (2 menit per KM)
  return Math.round((distKm || 10) * 2);
}

// Helper untuk memetakan kecamatan secara dinamis (Ultra-Safe dari nilai Null/Undefined)
function getRouteDistricts(name: string | null | undefined): string[] {
  const n = String(name || "").toLowerCase();
  const districts: string[] = ["Semua Kecamatan"];
  
  if (n.includes("stasiun") || n.includes("pasar") || n.includes("kota") || n.includes("gayatri")) {
    districts.push("Tulungagung Kota");
  }
  if (n.includes("kedungwaru") || n.includes("stasiun") || n.includes("ngantru") || n.includes("ngunut") || n.includes("gayatri")) {
    districts.push("Kedungwaru");
  }
  if (n.includes("ngunut") || n.includes("rejotangan") || n.includes("sumbergempol") || n.includes("gayatri")) {
    districts.push("Ngunut");
  }
  if (n.includes("boyolangu") || n.includes("campurdarat") || n.includes("kalidawir")) {
    districts.push("Boyolangu");
  }
  if (n.includes("kauman") || n.includes("gondang") || n.includes("sendang") || n.includes("pagerwojo")) {
    districts.push("Kauman");
  }
  if (n.includes("bandung") || n.includes("pakel")) {
    districts.push("Bandung");
  }
  if (n.includes("gondang") || n.includes("kauman")) {
    districts.push("Gondang");
  }
  if (n.includes("ngantru") || n.includes("karangrejo")) {
    districts.push("Ngantru");
  }
  return districts;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const BACKEND_URL = "http://localhost:8000"; // URL FastAPI

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`[WebGIS Gateway] ${req.method} ${req.path}`);
    next();
  });

  // Auth Login Bridge (100% Menembak ke FastAPI)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          success: false, 
          message: data.detail || "Email atau password salah!" 
        });
      }
      
      res.json({
        success: true,
        token: data.access_token,
        user: { 
          name: data.user_nama, 
          email: username, 
          role: data.user_role,
          token: data.access_token
        }
      });
    } catch (err) {
      console.error("Gagal koneksi ke FastAPI:", err);
      res.status(500).json({ 
        success: false, 
        message: "Koneksi ke backend FastAPI gagal! Pastikan server FastAPI di port 8000 menyala." 
      });
    }
  });

  // Ambil Semua Halte (GeoJSON format bridge)
  app.get("/api/halts", async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/titik-transportasi/geojson`);
      const data = await response.json();
      
      const mappedFeatures = (data.features || []).map((f: any) => ({
        type: "Feature",
        id: f.properties.id_titik,
        geometry: f.geometry,
        properties: {
          id: String(f.properties.id_titik),
          name: f.properties.nama_titik,
          description: f.properties.alamat || `Kategori: ${f.properties.jenis_titik}`,
          facilities: []
        }
      }));

      res.json({ type: "FeatureCollection", features: mappedFeatures });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Detail Satu Halte + Hubungan Rute (Relational Join Bridge)
  app.get("/api/halts/:id", async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/titik-transportasi/${req.params.id}`);
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.json({
        id: String(data.id_titik),
        name: data.nama_titik,
        description: data.alamat,
        facilities: [], // Dikirim default kosong
        geometry: {
          type: "Point",
          coordinates: [data.longitude, data.latitude]
        },
        assignedRoutes: (data.rute_yang_melewati || []).map((r: any) => ({
          routeId: String(r.id_rute),
          name: r.nama_trayek,
          type: "AKDP",
          via: ""
        }))
      });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Tambah Halte Admin (POST)
  app.post("/api/halts", async (req: Request, res: Response) => {
    const { name, description, coordinates } = req.body;
    const token = req.headers.authorization;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/titik-transportasi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          nama_titik: name,
          jenis_titik: "halte",
          alamat: description || "",
          longitude: Number(coordinates[0]),
          latitude: Number(coordinates[1])
        })
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.status(201).json({ status: "success", data });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Update Halte Admin (PUT)
  app.put("/api/halts/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, coordinates } = req.body;
    const token = req.headers.authorization;
    try {
      const payload: any = {
        nama_titik: name,
        alamat: description
      };
      if (coordinates) {
        payload.longitude = Number(coordinates[0]);
        payload.latitude = Number(coordinates[1]);
      }
      const response = await fetch(`${BACKEND_URL}/api/admin/titik-transportasi/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.json({ status: "success", data });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Hapus Halte Admin (DELETE)
  app.delete("/api/halts/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/titik-transportasi/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token || ""
        }
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.json({ status: "success", message: "Halte berhasil dihapus" });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Ambil Semua Rute AKDP (GeoJSON format bridge)
  app.get("/api/routes", async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rute/geojson`);
      const data = await response.json();

      const mappedFeatures = (data.features || []).map((f: any) => ({
        type: "Feature",
        id: f.properties.id_rute,
        geometry: f.geometry,
        properties: {
          id: String(f.properties.id_rute),
          name: f.properties.nama_trayek,
          via: `${f.properties.titik_awal || "Mulai"} s/d ${f.properties.titik_akhir || "Selesai"}`,
          type: mapJenisAngkutan(f.properties.jenis_angkutan),
          startPoint: f.properties.titik_awal || "",
          endPoint: f.properties.titik_akhir || "",
          distKm: f.properties.panjang_rute || 10,
          // Menghitung waktu tempuh berdasarkan rasio jarak KM fisik rute
          durationMin: parseDurationMin(undefined, f.properties.panjang_rute || 10),
          operatingHours: f.properties.jam_operasional || "06:00 - 18:00 WIB",
          intervalMin: "15 mnt",
          // Meneruskan teks status riil langsung (Aktif, Maintenance, atau Nonaktif)
          status: f.properties.status_rute || "Aktif",
          districts: getRouteDistricts(f.properties.nama_trayek)
        }
      }));

      res.json({ type: "FeatureCollection", features: mappedFeatures });
    } catch (err) {
      console.error("Gagal memproses rute:", err);
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Detail Satu Rute + Daftar Urutan Halte (ST_Geometry Bridge)
  app.get("/api/routes/:id", async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rute/${req.params.id}`);
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      const haltsSeq = (data.stops || []).map((stop: any) => ({
        id: String(stop.id_titik),
        name: stop.nama_titik,
        description: `Urutan ke-${stop.urutan}`,
        facilities: [],
        coordinates: [stop.longitude, stop.latitude],
        stopOrder: stop.urutan
      }));

      res.json({
        id: String(data.id_rute),
        name: data.nama_trayek,
        via: `${data.titik_awal} - ${data.titik_akhir}`,
        type: mapJenisAngkutan(data.jenis_angkutan),
        startPoint: data.titik_awal,
        endPoint: data.titik_akhir,
        distKm: data.panjang_rute || 10,
        // AMBIL NILAI RIIL TRAYEK DARI KOLOM DATABASE POSTGRESQL
        durationMin: parseDurationMin(data.waktu_tempuh, data.panjang_rute),
        operatingHours: data.jam_operasional || "06:00 - 18:00 WIB",
        // Meneruskan teks status riil langsung (Aktif, Maintenance, atau Nonaktif)
        status: data.status_rute || "Aktif",
        geometry: data.geometry,
        haltsSequence: haltsSeq
      });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Tambah Rute Admin (POST)
  app.post("/api/routes", async (req: Request, res: Response) => {
    const { name, via, type, startPoint, endPoint, distKm, durationMin, operatingHours, status, coordinates } = req.body;
    const token = req.headers.authorization;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/rute/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          nama_trayek: name,
          kode_trayek: "AKDP-" + Math.floor(Math.random() * 100),
          titik_awal: startPoint || "",
          titik_akhir: endPoint || "",
          jenis_angkutan: type || "AKDP",
          jalur_dilalui: via || "",
          panjang_rute: distKm ? Number(distKm) : 10.0,
          waktu_tempuh: durationMin ? `${durationMin} menit` : "30 menit",
          tarif: 10000.0,
          status_rute: status || "Aktif",
          geojson_geometry: {
            type: "MultiLineString",
            coordinates: [coordinates]
          }
        })
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.status(201).json({ status: "success", data });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Update Rute Admin (PUT)
  app.put("/api/routes/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, via, type, startPoint, endPoint, distKm, durationMin, operatingHours, status, coordinates } = req.body;
    const token = req.headers.authorization;
    try {
      // Mengambil data rute asli dari database terlebih dahulu untuk mempertahankan kode_trayek & tarif asli
      const getResponse = await fetch(`${BACKEND_URL}/api/rute/${id}`);
      const existingData = getResponse.ok ? await getResponse.json() : {};

      const payload: any = {
        nama_trayek: name,
        kode_trayek: existingData.kode_trayek || "AKDP-01", 
        titik_awal: startPoint,
        titik_akhir: endPoint,
        jenis_angkutan: type,
        jalur_dilalui: via,
        panjang_rute: distKm ? Number(String(distKm).replace(",", ".")) : undefined,
        waktu_tempuh: durationMin ? `${durationMin} menit` : undefined,
        jam_operasional: operatingHours,
        tarif: existingData.tarif || 10000.0, 
        status_rute: status ? String(status) : "Aktif"
      };
      if (coordinates) {
        payload.geojson_geometry = {
          type: "MultiLineString",
          coordinates: [coordinates]
        };
      }
      const response = await fetch(`${BACKEND_URL}/api/admin/rute/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.json({ status: "success", data });
    } catch (err) {
      console.error("Gagal melakukan update rute:", err);
      res.status(500).json({ error: "Gagal memproses rute terdekat" });
    }
  });

  // Hapus Rute Admin (DELETE)
  app.delete("/api/routes/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/rute/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token || ""
        }
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      res.json({ status: "success", message: "Trayek berhasil dihapus" });
    } catch {
      res.status(500).json({ error: "Gagal memanggil FastAPI" });
    }
  });

  // Spatial Query: ST_DWithin Bridge
  app.get("/api/spatial/dwithin", async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query;
    try {
      const response = await fetch(`${BACKEND_URL}/api/halte/radius?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      const features = (data.data || []).map((t: any) => ({
        type: "Feature",
        id: t.id_titik,
        geometry: {
          type: "Point",
          coordinates: [t.longitude, t.latitude]
        },
        properties: {
          id: String(t.id_titik),
          name: t.nama_titik,
          description: t.alamat || `Kategori: ${t.jenis_titik}`,
          facilities: []
        }
      }));

      res.json({ type: "FeatureCollection", features });
    } catch {
      res.status(500).json({ error: "Gagal melakukan query ST_DWithin" });
    }
  });

  // Spatial Query: ST_Closest Route Bridge
  app.get("/api/spatial/closest-route", async (req: Request, res: Response) => {
    const { lat, lng } = req.query;
    try {
      const response = await fetch(`${BACKEND_URL}/api/rute/nearest?lat=${lat}&lng=${lng}&limit=1`);
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      if (data && data.length > 0) {
        const closest = data[0];
        const detailRes = await fetch(`${BACKEND_URL}/api/rute/${closest.id_rute}`);
        const detail = await detailRes.json();

        res.json({
          status: "success",
          query_point: [Number(lng), Number(lat)],
          distance_offset_meters: Math.round(closest.jarak_meter),
          route: {
            id: String(closest.id_rute),
            name: closest.nama_trayek,
            type: mapJenisAngkutan(detail.jenis_angkutan),
            distKm: detail.panjang_rute || 10
          }
        });
      } else {
        res.status(404).json({ message: "Tidak ada rute terdekat." });
      }
    } catch {
      res.status(500).json({ error: "Gagal memproses rute terdekat" });
    }
  });

  // --- HOOK VITE DEVELOPMENT MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WebGIS Gateway running on http://localhost:${PORT} connected directly to FastAPI (${BACKEND_URL})`);
  });
}

startServer();