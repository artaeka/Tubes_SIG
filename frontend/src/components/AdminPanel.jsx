import React, { useEffect, useState } from "react";
import { TransportType } from "../types.js";

export default function AdminPanel() {
  const [activeTab, setActiveTab ] = useState("routes");
  
  const [routesCol, setRoutesCol] = useState([]);
  const [haltsCol, setHaltsCol] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  
  const [haltForm, setHaltForm] = useState({
    name: "",
    description: "",
    lat: "",
    lng: ""
  });

  const [routeForm, setRouteForm] = useState({
    name: "",
    via: "",
    type: TransportType.AKDP,
    startPoint: "",
    endPoint: "",
    distKm: "",
    durationMin: "",
    operatingHours: "06:00 - 17:00 WIB",
    intervalMin: "15 mnt",
    status: "Aktif",
    districtsText: "Tulungagung Kota",
    coordinatesText: "111.9012, -8.0621\n111.9124, -8.0715"
  });

  const [alert, setAlert] = useState(null);

  const getSessionToken = () => {
    const session = localStorage.getItem("tulungagung-adm-session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.token ? `Bearer ${parsed.token}` : "";
      } catch {
        return "";
      }
    }
    return "";
  };

  const loadData = () => {
    setIsLoading(true);
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          setRoutesCol(data.features.map((f) => f.properties));
        }
      })
      .catch((err) => console.error(err));

    fetch("/api/halts")
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          setHaltsCol(data.features.map((f) => ({
            id: f.properties.id,
            name: f.properties.name,
            description: f.properties.description,
            geometry: f.geometry
          })));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDelete = (type, id) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${type === "route" ? "trayek" : "halte"} [${id}] ini? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const token = getSessionToken();
    const endpoint = type === "route" ? `/api/routes/${id}` : `/api/halts/${id}`;
    fetch(endpoint, { 
      method: "DELETE",
      headers: {
        "Authorization": token
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          triggerAlert("success", `${type === "route" ? "Trayek" : "Halte"} berhasil dihapus dari sistem.`);
          loadData();
        } else {
          triggerAlert("error", data.message || "Gagal menghapus data.");
        }
      })
      .catch((err) => triggerAlert("error", "Terjadi kesalahan sambungan server."));
  };

  const handleOpenAdd = (target) => {
    setEditingItem({ mode: "add", target });
    if (target === "halt") {
      setHaltForm({
        name: "",
        description: "",
        lat: "-8.0621",
        lng: "111.9012"
      });
    } else {
      setRouteForm({
        name: "",
        via: "",
        type: TransportType.AKDP,
        startPoint: "",
        endPoint: "",
        distKm: "",
        durationMin: "",
        operatingHours: "06:00 - 17:00 WIB",
        intervalMin: "15 mnt",
        status: "Aktif",
        districtsText: "Tulungagung Kota",
        coordinatesText: "111.9012, -8.0621\n111.9124, -8.0715"
      });
    }
  };

  const handleOpenEdit = (target, item) => {
    setEditingItem({ mode: "edit", target, id: item.id });
    if (target === "halt") {
      setHaltForm({
        name: item.name,
        description: item.description,
        lat: String(item.geometry.coordinates[1]),
        lng: String(item.geometry.coordinates[0])
      });
    } else {
      fetch(`/api/routes/${item.id}`)
        .then((res) => res.json())
        .then((detail) => {
          const coordsText = detail.geometry?.coordinates?.map((c) => `${c[0]}, ${c[1]}`).join("\n") || "";
          setRouteForm({
            name: detail.name,
            via: detail.via || "",
            type: detail.type,
            startPoint: detail.startPoint || "",
            endPoint: detail.endPoint || "",
            distKm: String(detail.distKm),
            durationMin: String(detail.durationMin),
            operatingHours: detail.operatingHours,
            intervalMin: detail.intervalMin,
            status: detail.status,
            districtsText: detail.districts?.join(", ") || "",
            coordinatesText: coordsText
          });
        });
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const { target, mode, id } = editingItem;
    const token = getSessionToken();
    let endpoint = "";
    let method = "POST";
    let payload = {};

    if (target === "halt") {
      endpoint = mode === "edit" ? `/api/halts/${id}` : "/api/halts";
      method = mode === "edit" ? "PUT" : "POST";
      payload = {
        name: haltForm.name,
        description: haltForm.description,
        coordinates: [Number(haltForm.lng), Number(haltForm.lat)]
      };
    } else {
      endpoint = mode === "edit" ? `/api/routes/${id}` : "/api/routes";
      method = mode === "edit" ? "PUT" : "POST";

      const regex = /-?\d+(?:\.\d+)?/g;
      const matches = (routeForm.coordinatesText || "").match(regex);
      const coords = [];
      
      if (matches) {
        const numbers = matches.map(Number);
        for (let i = 0; i < numbers.length; i += 2) {
          if (i + 1 < numbers.length) {
            coords.push([numbers[i], numbers[i+1]]);
          }
        }
      }

      if (coords.length < 2) {
        triggerAlert("error", "Rute membutuhkan minimal 2 koordinat valid! Contoh: 111.90, -8.06");
        return;
      }

      payload = {
        name: routeForm.name,
        via: routeForm.via,
        type: routeForm.type,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        distKm: Number(String(routeForm.distKm).replace(",", ".")),
        durationMin: Number(String(routeForm.durationMin).replace(",", ".")),
        operatingHours: routeForm.operatingHours,
        intervalMin: routeForm.intervalMin,
        status: routeForm.status,
        districts: routeForm.districtsText.split(",").map((s) => s.trim()).filter(Boolean),
        coordinates: coords
      };
    }

    fetch(endpoint, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          triggerAlert("success", `${target === "route" ? "Trayek" : "Halte"} berhasil ${mode === "edit" ? "disimpan" : "ditambahkan"}.`);
          setEditingItem(null);
          loadData();
        } else {
          triggerAlert("error", data.message || "Gagal menyimpan data.");
        }
      })
      .catch((err) => triggerAlert("error", "Terjadi kesalahan server."));
  };

  const filteredRoutes = routesCol.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.via.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHalts = haltsCol.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 max-w-[1440px] mx-auto px-gutter py-md select-none">
      {/* Alert bar */}
      {alert && (
        <div
          className={`fixed right-4 top-20 z-50 p-md rounded-xl shadow-2xl border flex items-center gap-md max-w-sm text-sm font-semibold transition-all ${
            alert.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-error-container text-error border-outline/20"
          }`}
        >
          <span className="material-icons-outlined">
            {alert.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{alert.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-sm border-b border-outline-variant mb-md gap-md">
        <div>
          <span className="text-[11px] font-sans text-on-surface-variant uppercase tracking-wider font-extrabold flex items-center gap-0.5">
            <span className="material-icons-outlined text-sm">admin_panel_settings</span>
            Port Hub Administrator
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
            Dashboard Pengelolaan WebGIS
          </h1>
        </div>

        <button
          onClick={() => handleOpenAdd(activeTab === "routes" ? "route" : "halt")}
          className="bg-primary text-on-primary font-bold px-lg py-sm rounded-lg hover:bg-opacity-95 text-xs flex items-center gap-1 active:scale-95 shadow transition-all cursor-pointer"
        >
          <span className="material-icons-outlined text-sm">add_circle</span>
          {activeTab === "routes" ? "Tambah Trayek Baru" : "Tambah Halte Baru"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-md mb-md">
        <div className="bg-surface-container-low p-1 rounded-xl flex border border-outline-variant">
          <button
            onClick={() => {
              setActiveTab("routes");
              setSearchQuery("");
            }}
            className={`px-lg py-sm rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === "routes" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-icons-outlined text-base">alt_route</span>
            Kelola Trayek ({routesCol.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("halts");
              setSearchQuery("");
            }}
            className={`px-lg py-sm rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === "halts" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-icons-outlined text-base">storefront</span>
            Kelola Halte ({haltsCol.length})
          </button>
        </div>

        <div className="relative md:w-80 group">
          <span className="material-icons-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-none">
            search
          </span>
          <input
            type="text"
            placeholder="Cari data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-[36px] pr-md py-2 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-on-surface"
          />
        </div>
      </div>

      {/* Table grids container */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <span className="material-icons-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-xs text-outline mt-2">Sinkronisasi data...</p>
        </div>
      ) : activeTab === "routes" ? (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant font-mono text-[10px] uppercase text-on-surface-variant">
              <tr>
                <th className="px-lg py-3 font-semibold">Kode</th>
                <th className="px-lg py-3 font-semibold">Nama Trayek</th>
                <th className="px-lg py-3 font-semibold">Tipe</th>
                <th className="px-lg py-3 font-semibold">Jarak / Jam Operasional</th>
                <th className="px-lg py-3 font-semibold">Status</th>
                <th className="px-lg py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-lg py-8 text-center text-outline italic">
                    Tidak ada trayek ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/35 transition-colors">
                    <td className="px-lg py-4 font-mono font-bold text-primary">{r.id}</td>
                    <td className="px-lg py-4">
                      <div className="font-bold text-on-surface block leading-normal">{r.name}</div>
                      <div className="text-xs text-on-surface-variant italic mt-1 leading-normal block">
                        {r.via}
                      </div>
                    </td>
                    <td className="px-lg py-4">
                      <span className="bg-outline-variant/35 text-on-surface-variant px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-lg py-4 font-medium text-on-surface-variant leading-relaxed">
                      <div>{r.distKm} KM (~{r.durationMin} Min)</div>
                      <div className="text-[10px] text-outline font-mono">{r.operatingHours}</div>
                    </td>
                    <td className="px-lg py-4">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
                          r.status === "Aktif"
                            ? "bg-green-500"
                            : r.status === "Maintenance"
                            ? "bg-yellow-500"
                            : "bg-error"
                        }`}
                        title={r.status}
                      />
                      <span className="font-bold text-on-surface text-[11px]">{r.status}</span>
                    </td>
                    <td className="px-lg py-4 text-center">
                      <div className="flex items-center justify-center gap-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit("route", r)}
                          className="p-1 px-2.5 text-primary bg-primary/10 rounded hover:bg-primary/20 hover:text-white transition-all cursor-pointer font-bold text-[10px] uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("route", r.id)}
                          className="p-1 px-2 text-error bg-error/10 hover:bg-error hover:text-white rounded transition-all cursor-pointer font-bold text-[10px] uppercase"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant font-mono text-[10px] uppercase text-on-surface-variant">
              <tr>
                <th className="px-lg py-3 font-semibold">Kode</th>
                <th className="px-lg py-3 font-semibold">Nama Halte</th>
                <th className="px-lg py-3 font-semibold">Deskripsi</th>
                <th className="px-lg py-3 font-semibold">Koordinat GPS</th>
                <th className="px-lg py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs">
              {filteredHalts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-lg py-8 text-center text-outline italic">
                    Tidak ada halte ditemukan.
                  </td>
                </tr>
              ) : (
                filteredHalts.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low/35 transition-colors">
                    <td className="px-lg py-4 font-mono font-bold text-primary">{h.id}</td>
                    <td className="px-lg py-4 font-bold text-on-surface">{h.name}</td>
                    
                    <td className="px-lg py-4">
                      <div className="text-xs text-on-surface-variant font-medium leading-normal max-w-xs block">
                        {h.description || "-"}
                      </div>
                    </td>
                    
                    <td className="px-lg py-4 font-mono text-on-surface-variant font-semibold">
                      {h.geometry.coordinates[1].toFixed(5)}, {h.geometry.coordinates[0].toFixed(5)}
                    </td>
                    <td className="px-lg py-4 text-center">
                      <div className="flex items-center justify-center gap-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit("halt", h)}
                          className="p-1 px-2.5 text-primary bg-primary/10 rounded hover:bg-primary/20 hover:text-white transition-all cursor-pointer font-bold text-[10px] uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("halt", h.id)}
                          className="p-1 px-2 text-error bg-error/10 hover:bg-error hover:text-white rounded transition-all cursor-pointer font-bold text-[10px] uppercase"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-outline-variant flex flex-col max-h-[90vh]">
            <header className="bg-primary px-lg py-md flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-sm">
                <span className="material-icons-outlined text-xl">
                  {editingItem.mode === "add" ? "add_circle" : "edit"}
                </span>
                
                <span className="font-display font-extrabold tracking-tight">
                  {editingItem.mode === "add" ? "Tambah" : "Edit"}{" "}
                  {editingItem.target === "route" ? "Trayek" : "Halte"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer text-white"
              >
                <span className="material-icons-outlined text-md font-bold block">close</span>
              </button>
            </header>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-lg space-y-md custom-scrollbar">
              {editingItem.target === "halt" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant flex items-center gap-0.5">
                      Nama Halte <b className="text-error">*</b>
                    </label>
                    <input
                      type="text"
                      required
                      value={haltForm.name}
                      onChange={(e) => setHaltForm({ ...haltForm, name: e.target.value })}
                      placeholder="e.g. Halte Stasiun Utama"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-xs md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant">Deskripsi Lokasi</label>
                    <textarea
                      rows={4}
                      value={haltForm.description}
                      onChange={(e) => setHaltForm({ ...haltForm, description: e.target.value })}
                      placeholder="Informasi detail mengenai posisi halte, ruko terdekat, dsb..."
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Lintang (Latitude)</label>
                    <input
                      type="text"
                      required
                      value={haltForm.lat}
                      onChange={(e) => setHaltForm({ ...haltForm, lat: e.target.value })}
                      placeholder="-8.0621"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono font-medium text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Bujur (Longitude)</label>
                    <input
                      type="text"
                      required
                      value={haltForm.lng}
                      onChange={(e) => setHaltForm({ ...haltForm, lng: e.target.value })}
                      placeholder="111.9012"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono font-medium text-on-surface"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-xs">
                  <div className="space-y-xs md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant">Nama Trayek <b className="text-error">*</b></label>
                    <input
                      type="text"
                      required
                      value={routeForm.name}
                      onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                      placeholder="e.g. Tulungagung - Boyolangu"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Jenis Transportasi</label>
                    <select
                      value={routeForm.type}
                      onChange={(e) => setRouteForm({ ...routeForm, type: e.target.value })}
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-bold text-primary"
                    >
                      <option value={TransportType.AKDP}>AKDP (Antar Kota)</option>
                      <option value={TransportType.ANGKOT}>Angkot Kota</option>
                      <option value={TransportType.PEDESAAN}>Angkutan Pedesaan</option>
                      <option value={TransportType.BUS_SEKOLAH}>Bus Sekolah</option>
                      <option value={TransportType.TRANS_TULUNGAGUNG}>Trans Tulungagung</option>
                    </select>
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Status</label>
                    <select
                      value={routeForm.status}
                      onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-bold"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Titik Keberangkatan Awal</label>
                    <input
                      type="text"
                      value={routeForm.startPoint}
                      onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                      placeholder="Gayatri Terminal"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Titik Pemberhentian Akhir</label>
                    <input
                      type="text"
                      value={routeForm.endPoint}
                      onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                      placeholder="Pasor Boyolangu"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Jarak Trayek (KM)</label>
                    <input
                      type="text"
                      required
                      value={routeForm.distKm}
                      onChange={(e) => setRouteForm({ ...routeForm, distKm: e.target.value })}
                      placeholder="e.g. 8.4"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-xs">
                    <label className="text-xs font-bold text-on-surface-variant">Waktu Tempuh Estimasi (Menit)</label>
                    <input
                      type="text"
                      required
                      value={routeForm.durationMin}
                      onChange={(e) => setRouteForm({ ...routeForm, durationMin: e.target.value })}
                      placeholder="e.g. 25"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-xs md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant">Via Lintasan Jalan</label>
                    <input
                      type="text"
                      value={routeForm.via}
                      onChange={(e) => setRouteForm({ ...routeForm, via: e.target.value })}
                      placeholder="Via Jl. Jayeng Kusuma, Popoh Junction, dsb..."
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant">Kecamatan Coverage (Pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={routeForm.districtsText}
                      onChange={(e) => setRouteForm({ ...routeForm, districtsText: e.target.value })}
                      placeholder="Tulungagung Kota, Boyolangu, Bandung"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-on-surface"
                    />
                  </div>

                  <div className="space-y-xs md:col-span-2">
                    <div className="flex justify-between items-center bg-primary-container/[0.05] p-2.5 rounded-lg border border-primary/20">
                      <span className="font-extrabold text-primary uppercase text-[10px] tracking-wider block font-mono">Spasial GIS LineString</span>
                      <span className="text-[10px] text-on-surface-variant">Format: <b>Longitude, Latitude</b> (Satu baris per vertex)</span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      value={routeForm.coordinatesText}
                      onChange={(e) => setRouteForm({ ...routeForm, coordinatesText: e.target.value })}
                      placeholder="111.9012, -8.0621\n111.9124, -8.0715\n111.9355, -8.1022"
                      className="w-full p-sm bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              <footer className="pt-4 border-t border-outline-variant flex justify-end gap-sm shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-lg py-2.5 border border-outline-variant hover:bg-surface-container-low rounded-lg font-bold text-xs cursor-pointer text-on-surface-variant"
                >
                  Batalkan
                </button>
                
                <button
                  type="submit"
                  className="bg-primary hover:bg-opacity-95 text-on-primary font-bold px-xl py-2.5 rounded-lg hover:shadow-lg transition-all text-xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span className="material-icons-outlined text-sm">save</span>
                  Simpan
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}