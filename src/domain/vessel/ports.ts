import type { CollectionResult, Strait, VesselType } from "../../shared/types";
import type { RawAisMessage, Vessel, VesselPosition } from "./entities";

export interface VesselCollectorPort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onMessage(handler: (message: RawAisMessage) => void): void;
}

export interface VesselRepositoryPort {
  upsertVessel(vessel: Vessel): Promise<void>;
  savePosition(position: VesselPosition): Promise<void>;
  findByType(type: VesselType): Promise<Vessel[]>;
  findByStrait(strait: Strait): Promise<(Vessel & { latestPosition: VesselPosition })[]>;
  findPositionHistory(vesselId: string, from: Date, to: Date): Promise<VesselPosition[]>;
}
