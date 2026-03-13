import { describe, it, expect, vi } from "vitest";
import { processVesselMessage } from "../src/usecases/process-vessel";
import type { VesselRepositoryPort } from "../src/domain/vessel/ports";
import type { RawAisMessage } from "../src/domain/vessel/entities";

function createMockRepository(): VesselRepositoryPort {
  return {
    upsertVessel: vi.fn().mockResolvedValue(undefined),
    savePosition: vi.fn().mockResolvedValue(undefined),
    findByType: vi.fn().mockResolvedValue([]),
    findByZone: vi.fn().mockResolvedValue([]),
    findPositionHistory: vi.fn().mockResolvedValue([]),
  };
}

describe("processVesselMessage", () => {
  it("should process a crude tanker message", async () => {
    const repo = createMockRepository();
    const raw: RawAisMessage = {
      mmsi: "123456789",
      name: "TANKER ONE",
      shipType: 81,
      flag: "PA",
      tonnage: 50000,
      lat: 26.5,
      lon: 56.2,
      speed: 12.5,
      course: 180,
      timestamp: new Date("2026-03-13T10:00:00Z"),
    };

    const result = await processVesselMessage(raw, repo);

    expect(result.vesselType).toBe("tanker_crude");
    expect(result.zoneDetected).toBe(true); // Hormuz
    expect(repo.upsertVessel).toHaveBeenCalledTimes(1);
    expect(repo.savePosition).toHaveBeenCalledTimes(1);
  });

  it("should skip non-tanker vessels", async () => {
    const repo = createMockRepository();
    const raw: RawAisMessage = {
      mmsi: "987654321",
      name: "CARGO SHIP",
      shipType: 70,
      flag: "LR",
      tonnage: 30000,
      lat: 26.5,
      lon: 56.2,
      speed: 10.0,
      course: 90,
      timestamp: new Date("2026-03-13T10:00:00Z"),
    };

    const result = await processVesselMessage(raw, repo);

    expect(result.vesselType).toBeNull();
    expect(repo.upsertVessel).not.toHaveBeenCalled();
    expect(repo.savePosition).not.toHaveBeenCalled();
  });

  it("should detect LNG carrier", async () => {
    const repo = createMockRepository();
    const raw: RawAisMessage = {
      mmsi: "111222333",
      name: "LNG CARRIER",
      shipType: 84,
      flag: "QA",
      tonnage: 100000,
      lat: 27.0,
      lon: 50.0,
      speed: 15.0,
      course: 270,
      timestamp: new Date("2026-03-13T10:00:00Z"),
    };

    const result = await processVesselMessage(raw, repo);

    expect(result.vesselType).toBe("lng");
    expect(result.zoneDetected).toBe(true); // Persian Gulf
  });

  it("should handle vessel outside maritime zones", async () => {
    const repo = createMockRepository();
    const raw: RawAisMessage = {
      mmsi: "444555666",
      name: "TANKER FAR",
      shipType: 80,
      flag: "SG",
      tonnage: 40000,
      lat: 1.0,
      lon: 103.0,
      speed: 8.0,
      course: 45,
      timestamp: new Date("2026-03-13T10:00:00Z"),
    };

    const result = await processVesselMessage(raw, repo);

    expect(result.vesselType).toBe("tanker_product");
    expect(result.zoneDetected).toBe(false);
  });

  it("should save position with correct zone", async () => {
    const repo = createMockRepository();
    const raw: RawAisMessage = {
      mmsi: "777888999",
      name: "LPG HORMUZ",
      shipType: 82,
      flag: "AE",
      tonnage: 60000,
      lat: 26.5,
      lon: 56.2,
      speed: 11.0,
      course: 135,
      timestamp: new Date("2026-03-13T10:00:00Z"),
    };

    await processVesselMessage(raw, repo);

    const savedPosition = (repo.savePosition as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedPosition.zone).toBe("hormuz");
    expect(savedPosition.status).toBe("normal");
  });
});
