import type { VesselRepositoryPort } from "../domain/vessel/ports";
import type { RawAisMessage, Vessel, VesselPosition } from "../domain/vessel/entities";
import type { VesselType } from "../shared/types";
import { classifyShipType, classifyZone } from "../shared/classify";
import { randomUUID } from "crypto";

function rawToVessel(raw: RawAisMessage, vesselType: VesselType): Vessel {
  return {
    id: randomUUID(),
    mmsi: raw.mmsi,
    name: raw.name,
    type: vesselType,
    flag: raw.flag,
    tonnage: raw.tonnage,
  };
}

function rawToPosition(raw: RawAisMessage, vesselId: string): VesselPosition {
  return {
    id: randomUUID(),
    vesselId,
    lat: raw.lat,
    lon: raw.lon,
    speed: raw.speed,
    course: raw.course,
    zone: classifyZone(raw.lat, raw.lon),
    status: "normal",
    timestamp: raw.timestamp,
  };
}

export async function processVesselMessage(
  raw: RawAisMessage,
  repository: VesselRepositoryPort,
): Promise<{ vesselType: VesselType | null; zoneDetected: boolean }> {
  const vesselType = classifyShipType(raw.shipType);
  if (!vesselType) {
    return { vesselType: null, zoneDetected: false };
  }

  const vessel = rawToVessel(raw, vesselType);
  await repository.upsertVessel(vessel);

  const position = rawToPosition(raw, vessel.id);
  await repository.savePosition(position);

  return {
    vesselType,
    zoneDetected: position.zone !== null,
  };
}
