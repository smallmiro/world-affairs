import type { Strait, VesselStatus, VesselType } from "../../shared/types";

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
  strait: Strait | null;
  status: VesselStatus;
  timestamp: Date;
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
