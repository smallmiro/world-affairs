import { describe, it, expect, vi } from "vitest";
import { collectGeoEvents, goldsteinToSeverity } from "../src/usecases/collect-geo-events";
import type { GeoCollectorPort, GeoRepositoryPort } from "../src/domain/geopolitics/ports";
import type { RawGeoEvent } from "../src/domain/geopolitics/entities";

function createMockCollector(events: RawGeoEvent[]): GeoCollectorPort {
  return {
    collect: vi.fn().mockResolvedValue({
      data: events,
      collectedAt: new Date(),
      source: "test",
    }),
  };
}

function createMockRepository(existingTitles: Set<string> = new Set()): GeoRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findLatest: vi.fn().mockResolvedValue([]),
    findBySeverity: vi.fn().mockResolvedValue([]),
    findByEventType: vi.fn().mockResolvedValue([]),
    filterExistingTitles: vi.fn().mockImplementation(
      () => Promise.resolve(existingTitles),
    ),
  };
}

const SAMPLE_EVENTS: RawGeoEvent[] = [
  {
    source: "gdelt",
    eventType: "conflict",
    title: "Russia-Ukraine conflict escalation",
    description: null,
    countries: ["RU", "UA"],
    lat: 50.4,
    lon: 30.5,
    goldsteinScale: -9.0,
    eventDate: new Date("2026-03-13"),
    originalLanguage: "en",
  },
  {
    source: "gdelt",
    eventType: "sanctions",
    title: "New Iran sanctions imposed",
    description: "US imposes new sanctions",
    countries: ["US", "IR"],
    lat: null,
    lon: null,
    goldsteinScale: -5.0,
    eventDate: new Date("2026-03-13"),
    originalLanguage: "en",
  },
];

describe("collectGeoEvents", () => {
  it("should collect and save geo events", async () => {
    const collector = createMockCollector(SAMPLE_EVENTS);
    const repo = createMockRepository();

    const result = await collectGeoEvents([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(2);
    expect(result.skipped).toBe(0);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it("should convert RawGeoEvent to GeoEvent with severity", async () => {
    const collector = createMockCollector([SAMPLE_EVENTS[0]]);
    const repo = createMockRepository();

    await collectGeoEvents([collector], repo);

    const savedEvents = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedEvents[0].severity).toBe("critical"); // goldstein -9.0
    expect(savedEvents[0].title.en).toBe("Russia-Ukraine conflict escalation");
    expect(savedEvents[0].title.ko).toBe("");
  });

  it("should handle multiple collectors", async () => {
    const c1 = createMockCollector([SAMPLE_EVENTS[0]]);
    const c2 = createMockCollector([SAMPLE_EVENTS[1]]);
    const repo = createMockRepository();

    const result = await collectGeoEvents([c1, c2], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(2);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it("should handle empty collector result", async () => {
    const collector = createMockCollector([]);
    const repo = createMockRepository();

    const result = await collectGeoEvents([collector], repo);

    expect(result.total).toBe(0);
    expect(result.saved).toBe(0);
    expect(result.skipped).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should skip already existing events by title", async () => {
    const collector = createMockCollector(SAMPLE_EVENTS);
    const repo = createMockRepository(new Set(["Russia-Ukraine conflict escalation"]));

    const result = await collectGeoEvents([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("should skip all when all exist", async () => {
    const collector = createMockCollector(SAMPLE_EVENTS);
    const repo = createMockRepository(
      new Set(["Russia-Ukraine conflict escalation", "New Iran sanctions imposed"]),
    );

    const result = await collectGeoEvents([collector], repo);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(0);
    expect(result.skipped).toBe(2);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe("goldsteinToSeverity", () => {
  it("should return critical for |scale| >= 8", () => {
    expect(goldsteinToSeverity(-9.0)).toBe("critical");
    expect(goldsteinToSeverity(10.0)).toBe("critical");
  });

  it("should return high for |scale| >= 5", () => {
    expect(goldsteinToSeverity(-5.0)).toBe("high");
    expect(goldsteinToSeverity(7.0)).toBe("high");
  });

  it("should return medium for |scale| >= 2", () => {
    expect(goldsteinToSeverity(-3.0)).toBe("medium");
    expect(goldsteinToSeverity(2.5)).toBe("medium");
  });

  it("should return low for |scale| < 2", () => {
    expect(goldsteinToSeverity(1.0)).toBe("low");
    expect(goldsteinToSeverity(-0.5)).toBe("low");
  });

  it("should return medium for null", () => {
    expect(goldsteinToSeverity(null)).toBe("medium");
  });
});
