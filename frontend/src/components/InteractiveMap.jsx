import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TransportType } from "../types.js";

export default function InteractiveMap({ onSelectRoute }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  const [routesGeoJSON, setRoutesGeoJSON] = useState(null);
  const [haltsGeoJSON, setHaltsGeoJSON] = useState(null);
  const [searchMode, setSearchMode] = useState("radius");
  const [radiusMeters, setRadiusMeters] = useState(2000);
  
  const [selectedTypes, setSelectedTypes] = useState([
    TransportType.AKDP,
    TransportType.ANGKOT,
    TransportType.BUS_SEKOLAH,
    TransportType.PEDESAAN,
    TransportType.TRANS_TULUNGAGUNG
  ]);
  const [selectedDistrict, setSelectedDistrict] = useState("Semua Kecamatan");
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [focusedHaltId, setFocusedHaltId] = useState(null);

  const [showHalts, setShowHalts] = useState(true);
  const [showTerminals, setShowTerminals] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);

  const [circleCenter, setCircleCenter] = useState(null);
  const [withinHalts, setWithinHalts] = useState([]);
  const [closestRouteResult, setClosestRouteResult] = useState(null);

  const [basemap, setBasemap] = useState("osm");

  const circleLayerRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const routeLayersGroupRef = useRef(null);
  const haltLayersGroupRef = useRef(null);
  const trafficLayerGroupRef = useRef(null);
  const basemapLayerRef = useRef(null);

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => setRoutesGeoJSON(data))
      .catch((err) => console.error("Error loading routes GeoJSON:", err));

    fetch("/api/halts")
      .then((res) => res.json())
      .then((data) => setHaltsGeoJSON(data))
      .catch((err) => console.error("Error loading halts GeoJSON:", err));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(
      [-8.0667, 111.9012],
      13
    );
    mapRef.current = map;

    const initialTile = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    basemapLayerRef.current = initialTile;

    routeLayersGroupRef.current = L.layerGroup().addTo(map);
    haltLayersGroupRef.current = L.layerGroup().addTo(map);
    trafficLayerGroupRef.current = L.layerGroup();

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setCircleCenter([lat, lng]);
      
      setFocusedHaltId(null);
      setSearchQuery("");
    });

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const BASEMAP_TILES = {
      osm: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: { attribution: '© OpenStreetMap', maxZoom: 19 }
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: { attribution: "© Esri World Imagery", maxZoom: 19 }
      },
      topo: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        options: { attribution: '© OpenTopoMap', maxZoom: 17 }
      }
    };

    if (basemapLayerRef.current) {
      mapRef.current.removeLayer(basemapLayerRef.current);
    }

    const config = BASEMAP_TILES[basemap] || BASEMAP_TILES.osm;
    const newLayer = L.tileLayer(config.url, config.options).addTo(mapRef.current);
    basemapLayerRef.current = newLayer;
  }, [basemap]);

  const handleMyLocation = () => {
    if (!mapRef.current) return;
    mapRef.current.locate({ setView: true, maxZoom: 14 });
    mapRef.current.once("locationfound", (e) => {
      const { lat, lng } = e.latlng;
      setCircleCenter([lat, lng]);
      
      const pulseIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-6 h-6 bg-primary-container opacity-30 rounded-full animate-ping"></div>
                 <div class="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg"></div>
               </div>`,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([lat, lng], { icon: pulseIcon })
        .addTo(mapRef.current)
        .bindPopup("<b>Lokasi Anda</b><br>Dideteksi via GPS Browser")
        .openPopup();
    });
  };

  useEffect(() => {
    if (!circleCenter || !mapRef.current) return;

    const [lat, lng] = circleCenter;

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const pinIcon = L.divIcon({
        html: `<div class="flex items-center justify-center text-error">
                 <span class="material-icons-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">location_on</span>
               </div>`,
        className: "custom-div-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      centerMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(mapRef.current);
    }

    if (searchMode === "radius") {
      if (circleLayerRef.current) {
        circleLayerRef.current.setLatLng([lat, lng]);
        circleLayerRef.current.setRadius(radiusMeters);
      } else {
        circleLayerRef.current = L.circle([lat, lng], {
          radius: radiusMeters,
          color: "#1976d2",
          fillColor: "#a5c8ff",
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: "4, 4"
        }).addTo(mapRef.current);
      }

      fetch(`/api/spatial/dwithin?lat=${lat}&lng=${lng}&radius=${radiusMeters}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.features) {
            const list = data.features.map((feat) => ({
              id: feat.properties.id,
              name: feat.properties.name,
              description: feat.properties.description,
              facilities: feat.properties.facilities,
              calculated_distance_meters: feat.properties.calculated_distance_meters,
              geometry: feat.geometry
            }));
            setWithinHalts(list);
          }
        })
        .catch((err) => console.error("Radius query error:", err));

      setClosestRouteResult(null);
    } else {
      if (circleLayerRef.current) {
        circleLayerRef.current.remove();
        circleLayerRef.current = null;
      }

      fetch(`/api/spatial/closest-route?lat=${lat}&lng=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setClosestRouteResult(data);
          }
        })
        .catch((err) => console.error("Closest rute query error:", err));

      setWithinHalts([]);
    }
  }, [circleCenter, searchMode, radiusMeters]);

  useEffect(() => {
    if (!mapRef.current || !routesGeoJSON || !haltsGeoJSON) return;

    if (routeLayersGroupRef.current) {
      routeLayersGroupRef.current.clearLayers();
    }
    if (haltLayersGroupRef.current) {
      haltLayersGroupRef.current.clearLayers();
    }
    if (trafficLayerGroupRef.current) {
      trafficLayerGroupRef.current.clearLayers();
    }

    routesGeoJSON.features.forEach((feature) => {
      const props = feature.properties;
      const geom = feature.geometry;

      if (focusedHaltId) return;

      // Mengamankan Penyelarasan Tipe Angkutan
      let routeTypeClean = "AKDP";
      const rawType = (props.type || "").toLowerCase();
      if (rawType.includes("angkot")) routeTypeClean = "ANGKOT";
      else if (rawType.includes("sekolah") || rawType.includes("feeder")) routeTypeClean = "BUS_SEKOLAH";
      else if (rawType.includes("pedesaan")) routeTypeClean = "PEDESAAN";
      else if (rawType.includes("trans")) routeTypeClean = "TRANS_TULUNGAGUNG";
      else routeTypeClean = "AKDP";

      const selectedTypesUpper = selectedTypes.map((t) => String(t).toUpperCase());
      if (!selectedTypesUpper.includes(routeTypeClean)) return;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const nameMatch = (props.name || "").toLowerCase().includes(q);
        const viaMatch = (props.via || "").toLowerCase().includes(q);
        const idMatch = (props.id || "").toLowerCase().includes(q);
        if (!nameMatch && !viaMatch && !idMatch) return;
      }

      // Memetakan Kecamatan secara Lokal di React Berdasarkan Nama Trayek
      const n = (props.name || "").toLowerCase();
      const routeDistricts = ["Semua Kecamatan"];
      if (n.includes("stasiun") || n.includes("pasar") || n.includes("kota") || n.includes("gayatri")) {
        routeDistricts.push("Tulungagung Kota");
      }
      if (n.includes("kedungwaru") || n.includes("stasiun") || n.includes("ngantru") || n.includes("ngunut") || n.includes("gayatri")) {
        routeDistricts.push("Kedungwaru");
      }
      if (n.includes("ngunut") || n.includes("rejotangan") || n.includes("sumbergempol") || n.includes("gayatri")) {
        routeDistricts.push("Ngunut");
      }
      if (n.includes("boyolangu") || n.includes("campurdarat") || n.includes("kalidawir")) {
        routeDistricts.push("Boyolangu");
      }
      if (n.includes("kauman") || n.includes("gondang") || n.includes("sendang") || n.includes("pagerwojo")) {
        routeDistricts.push("Kauman");
      }
      if (n.includes("bandung") || n.includes("pakel")) {
        routeDistricts.push("Bandung");
      }
      if (n.includes("gondang") || n.includes("kauman")) {
        routeDistricts.push("Gondang");
      }
      if (n.includes("ngantru") || n.includes("karangrejo")) {
        routeDistricts.push("Ngantru");
      }

      if (selectedDistrict !== "Semua Kecamatan") {
        const selectedDistClean = selectedDistrict.replace("Kec. ", "").trim().toLowerCase();
        const routeDistrictsClean = routeDistricts.map((d) => String(d).replace("Kec. ", "").trim().toLowerCase());
        if (!routeDistrictsClean.includes(selectedDistClean)) return;
      }

      // Menenentukan Warna Garis Spasial
      let routeColor = "#1d4ed8";
      let dash = "";
      let weight = 5.5;

      if (routeTypeClean === "PEDESAAN") {
        routeColor = "#4b5563";
        weight = 4.5;
        dash = "8, 6";
      } else if (routeTypeClean === "ANGKOT") {
        routeColor = "#ea580c";
        weight = 5;
      } else if (routeTypeClean === "BUS_SEKOLAH") {
        routeColor = "#a21caf";
        weight = 5;
      } else if (routeTypeClean === "TRANS_TULUNGAGUNG") {
        routeColor = "#0d9488";
        weight = 6;
      }

      if (props.status === "Maintenance") {
        routeColor = "#717783";
        dash = "5, 10";
      }

      // Deteksi Geometri Dinamis (MultiLineString / LineString)
      let polyCoordinates;
      if (geom.type === "MultiLineString") {
        polyCoordinates = geom.coordinates.map((line) => 
          line.map((coord) => [coord[1], coord[0]])
        );
      } else {
        polyCoordinates = geom.coordinates.map((coord) => [coord[1], coord[0]]);
      }

      const polyline = L.polyline(polyCoordinates, {
        color: routeColor,
        weight: weight,
        opacity: props.status === "Nonaktif" ? 0.3 : 0.85,
        dashArray: dash
      });

      polyline.on("mouseover", (e) => {
        e.target.setStyle({
          weight: weight + 3,
          opacity: 1.0
        });
      });
      polyline.on("mouseout", (e) => {
        e.target.setStyle({
          weight: weight,
          opacity: props.status === "Nonaktif" ? 0.3 : 0.85
        });
      });

      polyline.on("click", (e) => {
        if (mapRef.current) {
          mapRef.current.fitBounds(polyline.getBounds(), { padding: [100, 100], animate: true, duration: 0.5 });
        }
      });

      polyline.bindPopup(`
        <div class="p-1 min-w-[200px]">
          <span class="inline-block bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1">${props.type}</span>
          <h4 class="font-bold text-sm text-primary mb-1">${props.name}</h4>
          <p class="text-xs text-on-surface-variant italic mb-1">${props.via}</p>
          <div class="h-[1px] bg-outline-variant my-1"></div>
          <div class="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div>Jarak: <b>${props.distKm} KM</b></div>
            <div>Tempuh: <b>~${props.durationMin} Min</b></div>
            <div>WIB: <b class="text-tertiary">${props.operatingHours.split(" ")[0]}</b></div>
          </div>
          <button onclick="window._onRouteView('${props.id}')" class="w-full mt-2 bg-primary text-white text-xs py-1 rounded hover:bg-opacity-90 font-bold">Detail Trayek</button>
        </div>
      `);

      routeLayersGroupRef.current?.addLayer(polyline);
    });

    window._onRouteView = (id) => {
      onSelectRoute(id);
    };

    if (showHalts || showTerminals) {
      haltsGeoJSON.features.forEach((feature) => {
        const props = feature.properties;
        const geom = feature.geometry;

        if (focusedHaltId && String(props.id) !== String(focusedHaltId)) return;

        const isTerminal = props.name.includes("Terminal");
        
        if (isTerminal && !showTerminals) return;
        if (!isTerminal && !showHalts) return;

        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const nameMatch = (props.name || "").toLowerCase().includes(q);
          const descMatch = (props.description || "").toLowerCase().includes(q);
          if (!nameMatch && !descMatch) return;
        }

        let iconHtml = "";
        let markerSize = [28, 28];
        
        if (isTerminal) {
          iconHtml = `<div class="bg-primary text-white p-1 rounded-full border-2 border-white shadow-lg flex items-center justify-center h-full w-full">
                        <span class="material-icons-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                      </div>`;
          markerSize = [32, 32];
        } else {
          iconHtml = `<div class="bg-primary-container text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center h-full w-full">
                        <span class="material-icons-outlined text-[13px]" style="font-variation-settings: 'FILL' 0;">directions_bus</span>
                      </div>`;
        }

        const customHaltIcon = L.divIcon({
          html: iconHtml,
          className: "custom-div-icon",
          iconSize: markerSize,
          iconAnchor: [markerSize[0]/2, markerSize[1]/2]
        });

        const haltMarker = L.marker([geom.coordinates[1], geom.coordinates[0]], { icon: customHaltIcon });

        haltMarker.on("click", (e) => {
          if (mapRef.current) {
            mapRef.current.setView(e.latlng, 15, { animate: true, duration: 0.5 });
          }
        });

        const cleanPopupName = isTerminal ? props.name.replace("Halte Terminal", "Terminal") : props.name;

        haltMarker.bindPopup(`
          <div class="p-1 min-w-[200px]">
            <h4 class="font-bold text-sm text-primary flex items-center gap-1">
              <span class="material-icons-outlined text-sm">${isTerminal ? "directions_bus" : "storefront"}</span>
              ${cleanPopupName}
            </h4>
            <p class="text-xs text-on-surface-variant mt-1">${props.description}</p>
            <div class="h-[1px] bg-outline-variant my-2"></div>
            <div class="mt-2 text-[10px] font-mono text-outline">Koordinat: ${geom.coordinates[1].toFixed(5)}, ${geom.coordinates[0].toFixed(5)}</div>
          </div>
        `);

        haltLayersGroupRef.current?.addLayer(haltMarker);
      });
    }

    if (showTraffic) {
      const congestedSegments = [
        [
          [111.9031, -8.0667],
          [111.9124, -8.0715]
        ],
        [
          [111.9124, -8.0715],
          [111.9180, -8.079]
        ]
      ];

      congestedSegments.forEach((segment) => {
        const polyCoords = segment.map((c) => [c[1], c[0]]);
        const traffPoly = L.polyline(polyCoords, {
          color: "#ba1a1a",
          weight: 7,
          opacity: 0.75,
          dashArray: "1, 10"
        }).bindPopup("<b>Indikator Kepadatan</b><br>Tingkat Kemacetan: Berat (Simulasi)");

        trafficLayerGroupRef.current?.addLayer(traffPoly);
      });
      trafficLayerGroupRef.current?.addTo(mapRef.current);
    } else {
      trafficLayerGroupRef.current?.remove();
    }
  }, [routesGeoJSON, haltsGeoJSON, selectedTypes, selectedDistrict, showHalts, showTerminals, showTraffic, searchQuery, focusedHaltId]);

  const handleTypeToggle = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const filteredRoutesForSearch = (routesGeoJSON?.features || [])
    .map((f) => f.properties)
    .filter((r) => {
      if (searchQuery.trim() === "") return false;
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.via.toLowerCase().includes(q);
    });

  const filteredHaltsForSearch = (haltsGeoJSON?.features || [])
    .map((f) => {
      const coords = f.geometry.coordinates;
      return { ...f.properties, coordinates: coords };
    })
    .filter((h) => {
      if (searchQuery.trim() === "") return false;
      const q = searchQuery.toLowerCase();
      return h.name.toLowerCase().includes(q) || (h.description || "").toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden h-[calc(100vh-64px)]">
      <aside className="w-full md:w-[320px] bg-white border-r border-outline-variant flex flex-col shadow-lg z-10 shrink-0 select-none overflow-y-auto max-h-[40vh] md:max-h-full">
        <div className="p-md border-b border-outline-variant bg-surface-container-low">
          <h2 className="font-display text-lg font-bold text-primary">
            Filter Eksplorasi
          </h2>
        </div>

        <div className="p-md space-y-md flex-1 custom-scrollbar">
          <section className="space-y-xs">
            <label className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
              Cari Rute atau Halte
            </label>
            <div className="relative group">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Ketik nama rute/halte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-[36px] pr-md py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-on-surface"
              />
            </div>

            {searchQuery.trim() !== "" && (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-2 max-h-40 overflow-y-auto custom-scrollbar space-y-1 mt-1 text-[11px]">
                {filteredRoutesForSearch.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => {
                      const feat = routesGeoJSON?.features.find((f) => String(f.properties.id) === String(r.id));
                      if (feat && mapRef.current) {
                        let polyCoords;
                        const geom = feat.geometry;
                        if (geom.type === "MultiLineString") {
                          polyCoords = geom.coordinates.flatMap((line) => line.map((c) => [c[1], c[0]]));
                        } else {
                          polyCoords = geom.coordinates.map((c) => [c[1], c[0]]);
                        }
                        const bounds = L.latLngBounds(polyCoords);
                        mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
                        onSelectRoute(r.id);
                        setSearchQuery("");
                      }
                    }}
                    className="w-full text-left p-1.5 hover:bg-primary/10 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-primary truncate max-w-[150px]">{r.name}</span>
                    <span className="bg-primary/20 text-primary font-mono font-bold text-[8px] px-1.5 py-0.2 rounded uppercase">{r.type}</span>
                  </button>
                ))}

                {filteredHaltsForSearch.map((h) => {
                  const cleanHaltName = h.name.replace("Halte Terminal", "Terminal");
                  return (
                    <button
                      type="button"
                      key={h.id}
                      onClick={() => {
                        if (h.coordinates && mapRef.current) {
                          const [lng, lat] = h.coordinates;
                          mapRef.current.setView([lat, lng], 16, { animate: true, duration: 1 });

                          setFocusedHaltId(h.id);
                          setSearchQuery("");
                        }
                      }}
                      className="w-full text-left p-1.5 hover:bg-primary/10 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-on-surface truncate max-w-[150px]">{cleanHaltName}</span>
                      <span className="bg-secondary/20 text-secondary font-mono font-bold text-[8px] px-1.5 py-0.2 rounded uppercase">Halte</span>
                    </button>
                  );
                })}

                {filteredRoutesForSearch.length === 0 && filteredHaltsForSearch.length === 0 && (
                  <p className="text-center text-outline py-2 italic">Tidak ada rute/halte cocok.</p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-sm">
            <label className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
              Mode Pencarian Spasial
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSearchMode("radius")}
                className={`py-1.5 flex flex-col items-center justify-center border rounded-xl transition-all cursor-pointer ${
                  searchMode === "radius"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="material-icons-outlined text-sm mb-0.5">radar</span>
                <span className="text-xs">Radius</span>
              </button>
              <button
                onClick={() => setSearchMode("closest")}
                className={`py-1.5 flex flex-col items-center justify-center border rounded-xl transition-all cursor-pointer ${
                  searchMode === "closest"
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="material-icons-outlined text-sm mb-0.5">near_me</span>
                <span className="text-xs">Rute Terdekat</span>
              </button>
            </div>

            {searchMode === "radius" && (
              <div className="p-xs bg-surface-container-low rounded-lg mt-2 space-y-1">
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>Jarak Radius:</span>
                  <span className="text-primary font-bold">{radiusMeters} Meter</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full text-primary accent-primary h-1 bg-outline-variant rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-outline text-center">
                  *Klik area peta untuk memicu query spatial ST_DWithin
                </p>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
              Jenis Angkutan rute
            </label>
            <div className="space-y-1.5">
              {[
                { type: TransportType.AKDP, label: "AKDP (Antar Kota)", bg: "bg-[#1d4ed8]" },
                { type: TransportType.ANGKOT, label: "Angkot Kota", bg: "bg-[#ea580c]" },
                { type: TransportType.PEDESAAN, label: "Angkutan Pedesaan", bg: "bg-[#4b5563]" },
                { type: TransportType.BUS_SEKOLAH, label: "Bus Sekolah", bg: "bg-[#a21caf]" }, // Kapsul Ungu Fuchsia
                { type: TransportType.TRANS_TULUNGAGUNG, label: "Trans Tulungagung", bg: "bg-[#0d9488]" } // Kapsul Emerald
              ].map((item) => (
                <label
                  key={item.type}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer border border-transparent hover:border-outline-variant transition-all"
                >
                  <div className="flex items-center gap-xs">
                     <span className={`w-2 h-6 rounded-full ${item.bg}`}></span>
                    <span className="text-xs font-bold text-on-surface">{item.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(item.type)}
                    onChange={() => handleTypeToggle(item.type)}
                    className="rounded border-outline text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-sm">
            <label className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
              Filter Wilayah (Kecamatan)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-sm text-xs font-medium focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="Semua Kecamatan">Semua Kecamatan</option>
              <option value="Tulungagung Kota">Kec. Tulungagung Kota</option>
              <option value="Kedungwaru">Kec. Kedungwaru</option>
              <option value="Boyolangu">Kec. Boyolangu</option>
              <option value="Ngantru">Kec. Ngantru</option>
              <option value="Kauman">Kec. Kauman</option>
              <option value="Bandung">Kec. Bandung</option>
              <option value="Gondang">Kec. Gondang</option>
            </select>
          </section>

          <section className="space-y-sm pt-2 border-t border-outline-variant">
            <label className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
              Lapisan Peta (Layers)
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Tampilkan Halte Bus</span>
                <button
                  type="button"
                  onClick={() => setShowHalts(!showHalts)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    showHalts ? "bg-primary" : "bg-outline-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showHalts ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Terminal Gayatri</span>
                <button
                  type="button"
                  onClick={() => setShowTerminals(!showTerminals)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    showTerminals ? "bg-primary" : "bg-outline-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showTerminals ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Titik Kepadatan Lalu-lintas</span>
                <button
                  type="button"
                  onClick={() => setShowTraffic(!showTraffic)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    showTraffic ? "bg-primary" : "bg-outline-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showTraffic ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="p-3 bg-surface-container-low border-t border-outline-variant text-[11px] font-mono flex items-center justify-between md:sticky bottom-0">
          <span className="text-on-surface-variant uppercase font-bold text-[10px]">Total Rute Aktif</span>
          <span className="bg-primary/20 text-primary font-bold px-2 py-0.5 rounded">24 Jalur</span>
        </div>
      </aside>

      <section className="flex-1 relative h-full min-h-[400px]">
        <div 
          ref={mapContainerRef} 
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} 
        />

        <div className="absolute right-md top-md z-[1000] flex flex-col gap-sm items-end">
          <button
            onClick={handleMyLocation}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary border border-outline-variant hover:bg-surface-container-low active:scale-90 transition-all cursor-pointer"
            title="Lokasi Saya"
          >
            <span className="material-icons-outlined leading-none select-none">my_location</span>
          </button>

          <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl flex flex-col gap-1 border border-outline-variant w-12 items-center pointer-events-auto">
            <button
              onClick={() => setBasemap("osm")}
              className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all flex items-center justify-center cursor-pointer ${
                basemap === "osm"
                  ? "bg-primary text-white shadow-sm font-black"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
              title="Peta Standar (OSM)"
            >
              OSM
            </button>
            <button
              onClick={() => setBasemap("satellite")}
              className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all flex items-center justify-center cursor-pointer ${
                basemap === "satellite"
                  ? "bg-primary text-white shadow-sm font-black"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
              title="Peta Satelit (Esri)"
            >
              SAT
            </button>
            <button
              onClick={() => setBasemap("topo")}
              className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all flex items-center justify-center cursor-pointer ${
                basemap === "topo"
                  ? "bg-primary text-white shadow-sm font-black"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
              title="Peta Topografi (Topo)"
            >
              TOPO
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex flex-wrap items-center gap-x-4 gap-y-1 border border-outline-variant pointer-events-auto text-xs">
            <span className="font-mono text-on-surface-variant border-r pr-4 border-outline-variant font-bold">LEGEND</span>
            <div className="flex items-center gap-xs">
              <span className="w-3 h-1 bg-[#1d4ed8] rounded-full"></span>
              <span>AKDP</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="w-3 h-1 bg-[#ea580c] rounded-full"></span>
              <span>Angkot</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="w-3 h-1 bg-[#4b5563] rounded-full"></span>
              <span>Pedesaan</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="w-3 h-1 bg-[#a21caf] rounded-full"></span>
              <span>Bus Sekolah</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="w-3 h-1 bg-[#0d9488] rounded-full"></span>
              <span>Trans Tulungagung</span>
            </div>
            
            <div className="flex items-center gap-xs text-primary font-bold border-l pl-4 border-outline-variant">
              <div className="bg-primary text-white p-0.5 rounded-full border border-white shadow flex items-center justify-center w-5 h-5">
                <span className="material-icons-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
              </div>
              <span>Terminal</span>
            </div>

            <div className="flex items-center gap-xs text-primary font-bold">
              <div className="bg-primary-container text-white p-0.5 rounded-full border border-white shadow flex items-center justify-center w-5 h-5">
                <span className="material-icons-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 0" }}>directions_bus</span>
              </div>
              <span>Halte</span>
            </div>
          </div>
        </div>

        {circleCenter && (
          <div className="absolute top-md left-md z-[1000] w-80 bg-white rounded-2xl shadow-2xl p-md border border-outline-variant">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {searchMode === "radius" ? "ST_DWithin Output" : "ST_Closest Route"}
                </span>
                <h3 className="text-body-lg font-display font-extrabold text-primary tracking-tight mt-1">
                  Hasil Analisis Spasial
                </h3>
              </div>
              <button
                onClick={() => {
                  setCircleCenter(null);
                  setWithinHalts([]);
                  setClosestRouteResult(null);
                  if (centerMarkerRef.current) {
                    centerMarkerRef.current.remove();
                    centerMarkerRef.current = null;
                  }
                  if (circleLayerRef.current) {
                    circleLayerRef.current.remove();
                    circleLayerRef.current = null;
                  }
                }}
                className="text-on-surface-variant hover:text-error hover:bg-error-container p-1 rounded transition-colors cursor-pointer"
              >
                <span className="material-icons-outlined text-sm font-bold block">close</span>
              </button>
            </div>

            <p className="text-[10px] text-on-surface-variant mb-3 font-mono">
              Koordinat pusat: {circleCenter[0].toFixed(5)}, {circleCenter[1].toFixed(5)}
            </p>

            {searchMode === "radius" ? (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">
                  Ditemukan <b className="text-primary">{withinHalts.length} Halte/Shelter</b> dalam radius {radiusMeters} meter:
                </p>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {withinHalts.length === 0 ? (
                    <p className="text-xs text-outline text-center py-2 italic font-mono bg-surface-container-low rounded">
                      No halts found in range.
                    </p>
                  ) : (
                    withinHalts.map((h) => {
                      const cleanHaltNamePopup = h.name.replace("Halte Terminal", "Terminal");
                      return (
                        <div
                          key={h.id}
                          className="p-2 border border-outline-variant rounded-lg hover:border-primary transition-all text-xs bg-surface-container-low"
                        >
                          <div className="flex justify-between font-bold text-on-surface">
                            <span>{cleanHaltNamePopup}</span>
                            <span className="text-primary font-mono">{h.calculated_distance_meters || 0}m</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant italic truncate mt-0.5">
                            {h.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-sm">
                <p className="text-xs text-on-surface-variant">
                  Jaringan rute terdekat dari lokasi pilihan Anda:
                </p>
                {closestRouteResult ? (
                  <div className="p-3 border border-outline-variant bg-primary-container/5 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-primary">
                        {closestRouteResult.route.name}
                      </h4>
                      <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                        {closestRouteResult.route.type}
                      </span>
                    </div>
                    <div className="h-[1px] bg-outline-variant"></div>
                    <div className="grid grid-cols-2 text-[10px] text-on-surface-variant gap-1.5">
                      <div>Jarak offset: <b className="text-on-surface text-xs font-mono font-bold block">{closestRouteResult.distance_offset_meters} Meter</b></div>
                      <div>Total Jarak: <b className="text-on-surface font-bold font-mono block">{closestRouteResult.route.distKm} KM</b></div>
                    </div>
                    <button
                      onClick={() => onSelectRoute(closestRouteResult.route.id)}
                      className="w-full mt-2 bg-primary text-on-primary text-xs py-1 rounded-lg font-bold hover:shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Buka Rute & Halte Terkait
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-outline italic text-center py-4 bg-surface-container-low rounded">
                    Memuat kalkulasi spasial...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}