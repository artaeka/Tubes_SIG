export interface Halt {
  id: string;
  name: string;
  description: string;
  facilities: string[];
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface Route {
  id: string;
  name: string;
  via: string;
  type: string;
  startPoint: string;
  endPoint: string;
  distKm: number;
  durationMin: number;
  operatingHours: string;
  intervalMin: string;
  status: "Aktif" | "Maintenance" | "Nonaktif";
  districts: string[];
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export interface RouteHaltRelation {
  id: string;
  routeId: string;
  haltId: string;
  stopOrder: number;
}

export const TransportType = {
  AKDP: "AKDP",
  ANGKOT: "ANGKOT",
  BUS_SEKOLAH: "BUS_SEKOLAH",
  TRANS_TULUNGAGUNG: "TRANS_TULUNGAGUNG",
  PEDESAAN: "PEDESAAN"
} as const;

export type TransportTypeType = typeof TransportType[keyof typeof TransportType];
