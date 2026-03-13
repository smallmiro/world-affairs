import type { MaritimeZone, VesselStatus, VesselType } from "../../shared/types";

export interface Vessel {
  id: string;
  mmsi: string;
  name: string;
  type: VesselType;
  flag: string;
  tonnage: number | null;
}

export interface VesselPosition {
  id: string;
  vesselId: string;
  lat: number;
  lon: number;
  speed: number | null;
  course: number | null;
  zone: MaritimeZone | null;
  status: VesselStatus;
  timestamp: Date;
}

export interface VesselAnomaly {
  vesselId: string;
  type: "speed_anomaly" | "route_deviation" | "abnormal_anchoring";
  description: string;
  positions: VesselPosition[];
  detectedAt: Date;
}

export interface RawAisMessage {
  mmsi: string;
  name: string;
  shipType: number;
  flag: string;
  tonnage: number | null;
  lat: number;
  lon: number;
  speed: number | null;
  course: number | null;
  timestamp: Date;
}
