import type { MaritimeZone, VesselType } from "../../shared/types";
import type { RawAisMessage, Vessel, VesselAnomaly, VesselPosition } from "./entities";

export interface VesselCollectorPort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onMessage(handler: (message: RawAisMessage) => void): void;
}

export interface VesselAnomalyDetectorPort {
  detectAnomalies(positions: VesselPosition[]): Promise<VesselAnomaly[]>;
}

export interface VesselRepositoryPort {
  upsertVessel(vessel: Vessel): Promise<void>;
  savePosition(position: VesselPosition): Promise<void>;
  findByType(type: VesselType): Promise<Vessel[]>;
  findByZone(zone: MaritimeZone): Promise<(Vessel & { latestPosition: VesselPosition })[]>;
  findPositionHistory(vesselId: string, from: Date, to: Date): Promise<VesselPosition[]>;
}
