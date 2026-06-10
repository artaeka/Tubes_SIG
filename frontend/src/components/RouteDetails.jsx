import React, { useEffect, useState } from "react";

export default function RouteDetails({ selectedRouteId, onSelectRoute }) {
  const [routesList, setRoutesList] = useState([]);
  const [routeDetail, setRouteDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          const list = data.features.map((f) => f.properties);
          setRoutesList(list);
          if (!selectedRouteId && list.length > 0) {
            const featured = list.find((r) => r.id === "RT-003") || list[0];
            onSelectRoute(featured.id);
          }
        }
      })
      .catch((err) => console.error("Error fetching routes list:", err));
  }, []);

  useEffect(() => {
    if (!selectedRouteId) return;

    setIsLoading(true);
    fetch(`/api/routes/${selectedRouteId}`)
      .then((res) => res.json())
      .then((data) => {
        setRouteDetail(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading detailed router joins:", err);
        setIsLoading(false);
      });
  }, [selectedRouteId]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/routes/${selectedRouteId || "RT-003"}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 select-none">
        <span className="material-icons-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <p className="text-sm text-outline mt-2">Memuat basis data spasial rute...</p>
      </div>
    );
  }

  const currentRoute = routeDetail;

  return (
    <div className="flex-1 max-w-[1440px] mx-auto px-gutter py-md select-none">
      <div className="mb-md flex flex-wrap items-center justify-between gap-md bg-surface-container-low p-md rounded-xl border border-outline-variant">
        <div className="flex items-center gap-xs">
          <span className="material-icons-outlined text-primary text-xl font-bold">alt_route</span>
          <span className="text-xs font-bold font-mono text-on-surface-variant uppercase">Eksplorasi Trayek Lain:</span>
        </div>
        <select
          value={selectedRouteId || "RT-003"}
          onChange={(e) => onSelectRoute(e.target.value)}
          className="bg-white border border-outline-variant text-sm font-semibold rounded-lg p-sm focus:ring-primary focus:border-primary shrink-0 cursor-pointer text-primary"
        >
          {routesList.map((r) => (
            <option key={r.id} value={r.id}>
              [{r.id}] {r.name} ({r.type})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-sm border-b border-outline-variant mb-md gap-md">
        <div className="flex items-center gap-sm">
          <div className="flex flex-col">
            <span className="text-label-caps text-[11px] font-sans text-on-surface-variant uppercase tracking-wider font-extrabold flex items-center gap-0.5">
              <span className="material-icons-outlined text-sm">route</span>
              Detail Trayek Angkutan
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {currentRoute?.name || "Tulungagung - Boyolangu"}
            </h1>
          </div>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={handleShare}
            className="flex items-center gap-xs px-md py-sm border border-outline text-primary rounded-lg font-body-sm hover:bg-surface-container-low transition-all cursor-pointer font-bold"
          >
            <span className="material-icons-outlined text-sm">share</span>
            {copied ? "Tersalin!" : "Bagikan"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-xs px-md py-sm border border-outline text-primary rounded-lg font-body-sm hover:bg-surface-container-low transition-all cursor-pointer font-bold"
          >
            <span className="material-icons-outlined text-sm">picture_as_pdf</span>
            Cetak PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mb-xl">
        <div className="lg:col-span-7 flex flex-col gap-md">
          <section className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm h-full">
            <h2 className="font-display text-md font-extrabold text-primary mb-md border-b border-outline-variant pb-sm flex items-center gap-1.5 uppercase">
              <span className="material-icons-outlined">info</span>
              Informasi Trayek
            </h2>
            <div className="grid grid-cols-1 gap-sm">
              <div className="flex justify-between items-center py-2 border-b border-surface-container-low">
                <span className="text-xs font-semibold text-on-surface-variant">Jenis Layanan</span>
                <span className="text-xs font-extrabold text-secondary bg-secondary-container/30 px-2.5 py-0.5 rounded uppercase">
                  {currentRoute?.type || "AKDP"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-container-low">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">flag</span>
                  Titik Awal (Origin)
                </span>
                <span className="text-xs font-bold text-on-surface">
                  {currentRoute?.startPoint || "Terminal Gayatri"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-container-low">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">outlined_flag</span>
                  Titik Akhir (Destination)
                </span>
                <span className="text-xs font-bold text-on-surface">
                  {currentRoute?.endPoint || "Pasar Boyolangu"}
                </span>
              </div>
              <div className="flex flex-col py-2">
                <span className="text-xs font-semibold text-on-surface-variant mb-2">
                  Kecamatan yang Dilalui (Coverage)
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentRoute?.districts?.map((d) => (
                    <span
                      key={d}
                      className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold"
                    >
                      {d}
                    </span>
                  )) || <span className="text-xs text-outline italic">No district bound</span>}
                </div>
              </div>
              <div className="flex flex-col py-2">
                <span className="text-xs font-semibold text-on-surface-variant mb-1">
                  Rincian Lintasan
                </span>
                <p className="text-xs text-on-surface-variant font-medium bg-surface-container-low p-3 rounded-lg border border-outline-variant/50 leading-relaxed italic">
                  {currentRoute?.via || "-"}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between gap-md">
          <div className="grid grid-cols-2 gap-md shrink-0">
            <div className="bg-primary-container/10 p-md rounded-xl border border-primary/20 flex flex-col shadow-sm">
              <span className="material-icons-outlined text-primary mb-2 text-2xl font-bold">distance</span>
              <span className="text-[10px] font-mono text-primary/80 uppercase font-black tracking-wider">
                Estimasi Jarak
              </span>
              <span className="text-xl font-display font-extrabold text-primary tracking-tight mt-0.5">
                {currentRoute?.distKm || "8.4"} KM
              </span>
            </div>

            <div className="bg-secondary-container/15 p-md rounded-xl border border-secondary/20 flex flex-col shadow-sm">
              <span className="material-icons-outlined text-secondary mb-2 text-2xl font-bold">schedule</span>
              <span className="text-[10px] font-mono text-secondary/80 uppercase font-black tracking-wider">
                Waktu Tempuh
              </span>
              <span className="text-xl font-display font-extrabold text-secondary tracking-tight mt-0.5">
                ~{currentRoute?.durationMin || "25"} Menit
              </span>
            </div>
          </div>

          <section className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex items-center gap-md">
            <div className="p-3 bg-tertiary-fixed rounded-xl text-tertiary shrink-0">
              <span className="material-icons-outlined text-2xl block">query_builder</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide">Jam Operasional</h4>
              <p className="text-sm font-display font-extrabold text-primary tracking-tight mt-0.5">
                {currentRoute?.operatingHours || "05:00 - 18:00 WIB"}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Interval Keberangkatan: <b>{currentRoute?.intervalMin || "15-20 mnt"}</b>
              </p>
            </div>
          </section>

          {/* Quick Notice info */}
          <div className="p-md bg-surface-container-low border border-outline-variant/80 rounded-xl flex items-start gap-2.5">
            <span className="material-icons-outlined text-primary text-md mt-0.5 select-none">campaign</span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              *Informasi estimasi waktu tempuh dapat bervariasi bergantung pada kepadatan jalan raya. 
              Segera hubungi pos Dishub terdekat jika terdapat kendala pelayanan armada.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-md print:mt-10">
        <div className="flex justify-between items-end mb-md">
          <div>
            <h3 className="font-display text-lg font-extrabold text-on-surface tracking-tight">
              Daftar Halte & Titik Pemberhentian
            </h3>
            <p className="text-xs text-on-surface-variant">
              Terdapat sesar spasial {currentRoute?.haltsSequence?.length || 0} titik aktif sepanjang jalur trayek ini.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-lg py-md text-[10px] uppercase font-mono font-bold tracking-wider text-on-surface-variant">
                  Urutan
                </th>
                <th className="px-lg py-md text-[10px] uppercase font-mono font-bold tracking-wider text-on-surface-variant">
                  Nama Halte / Lokasi
                </th>
                <th className="px-lg py-md text-[10px] uppercase font-mono font-bold tracking-wider text-on-surface-variant">
                  Koordinat Spasial
                </th>
                <th className="px-lg py-md text-[10px] uppercase font-mono font-bold tracking-wider text-on-surface-variant">
                  Fasilitas Halte
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {currentRoute?.haltsSequence && currentRoute.haltsSequence.length > 0 ? (
                currentRoute.haltsSequence.map((seq, idx) => {
                  return (
                    <tr key={seq.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-lg py-4">
                        <span className="bg-primary/15 text-primary text-xs font-mono font-bold px-2.5 py-1 rounded">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-lg py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">{seq.name}</span>
                          <span className="text-[10px] text-on-surface-variant mt-0.5 italic text-outline">
                            {seq.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-lg py-4 text-xs font-mono text-on-surface-variant">
                        {seq.coordinates[1].toFixed(5)}, {seq.coordinates[0].toFixed(5)}
                      </td>
                      <td className="px-lg py-4">
                        <div className="flex gap-2">
                          {seq.facilities.map((fac) => {
                            let sym = "info";
                            if (fac === "wc") sym = "wc";
                            if (fac === "wifi") sym = "wifi";
                            if (fac === "mosque") sym = "mosque";
                            if (fac === "chair") sym = "chair";
                            if (fac === "local_parking") sym = "local_parking";
                            if (fac === "storefront") sym = "storefront";
                            return (
                              <span
                                key={fac}
                                className="material-icons-outlined text-on-surface-variant text-base bg-surface-container h-6 w-6 flex items-center justify-center rounded"
                                title={fac}
                              >
                                {sym}
                              </span>
                            );
                          })}
                          {seq.facilities.length === 0 && <span className="text-xs text-outline">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-lg py-8 text-center text-xs text-outline italic">
                    Belum terdapat titik halte yang terafiliasi dengan trayek ini dalam basis data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}