import type { VesselRepositoryPort } from "../../domain/vessel/ports";
import type { Vessel, VesselPosition } from "../../domain/vessel/entities";
import type { MaritimeZone, VesselType } from "../../shared/types";
import type { PrismaClient } from "../../generated/prisma/client";

export class VesselRepository implements VesselRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  async upsertVessel(vessel: Vessel): Promise<string> {
    const result = await this.prisma.vessel.upsert({
      where: { mmsi: vessel.mmsi },
      create: {
        id: vessel.id,
        mmsi: vessel.mmsi,
        name: vessel.name,
        type: vessel.type,
        flag: vessel.flag,
        tonnage: vessel.tonnage,
      },
      update: {
        name: vessel.name,
        type: vessel.type,
        flag: vessel.flag,
        tonnage: vessel.tonnage,
      },
    });
    return result.id;
  }

  async savePosition(position: VesselPosition): Promise<void> {
    await this.prisma.vesselPosition.create({
      data: {
        id: position.id,
        vesselId: position.vesselId,
        lat: position.lat,
        lon: position.lon,
        speed: position.speed,
        course: position.course,
        zone: position.zone,
        status: position.status,
        timestamp: position.timestamp,
      },
    });
  }

  async findByType(type: VesselType): Promise<Vessel[]> {
    const rows = await this.prisma.vessel.findMany({
      where: { type },
    });
    return rows.map((r) => ({
      id: r.id,
      mmsi: r.mmsi,
      name: r.name,
      type: r.type as VesselType,
      flag: r.flag,
      tonnage: r.tonnage,
    }));
  }

  async findByTypeWithPosition(type: VesselType): Promise<(Vessel & { latestPosition: VesselPosition | null })[]> {
    const rows = await this.prisma.vessel.findMany({
      where: { type },
      include: { positions: { orderBy: { timestamp: "desc" }, take: 1 } },
    });
    return rows.map((r) => ({
      id: r.id,
      mmsi: r.mmsi,
      name: r.name,
      type: r.type as VesselType,
      flag: r.flag,
      tonnage: r.tonnage,
      latestPosition: r.positions[0]
        ? {
            id: r.positions[0].id,
            vesselId: r.positions[0].vesselId,
            lat: r.positions[0].lat,
            lon: r.positions[0].lon,
            speed: r.positions[0].speed,
            course: r.positions[0].course,
            zone: r.positions[0].zone as MaritimeZone | null,
            status: r.positions[0].status as VesselPosition["status"],
            timestamp: r.positions[0].timestamp,
          }
        : null,
    }));
  }

  async findByZone(zone: MaritimeZone): Promise<(Vessel & { latestPosition: VesselPosition })[]> {
    const positions = await this.prisma.vesselPosition.findMany({
      where: { zone },
      orderBy: { timestamp: "desc" },
      include: { vessel: true },
      distinct: ["vesselId"],
    });

    return positions.map((p) => ({
      id: p.vessel.id,
      mmsi: p.vessel.mmsi,
      name: p.vessel.name,
      type: p.vessel.type as VesselType,
      flag: p.vessel.flag,
      tonnage: p.vessel.tonnage,
      latestPosition: {
        id: p.id,
        vesselId: p.vesselId,
        lat: p.lat,
        lon: p.lon,
        speed: p.speed,
        course: p.course,
        zone: p.zone as MaritimeZone | null,
        status: p.status as VesselPosition["status"],
        timestamp: p.timestamp,
      },
    }));
  }

  async findPositionHistory(vesselId: string, from: Date, to: Date): Promise<VesselPosition[]> {
    const rows = await this.prisma.vesselPosition.findMany({
      where: {
        vesselId,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
    });

    return rows.map((r) => ({
      id: r.id,
      vesselId: r.vesselId,
      lat: r.lat,
      lon: r.lon,
      speed: r.speed,
      course: r.course,
      zone: r.zone as MaritimeZone | null,
      status: r.status as VesselPosition["status"],
      timestamp: r.timestamp,
    }));
  }
}
