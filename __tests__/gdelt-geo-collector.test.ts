import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GdeltGeoCollector, classifyEventType, extractCountries } from "../src/adapters/collectors/gdelt-geo-collector";

const MOCK_GDELT_RESPONSE = {
  articles: [
    {
      url: "https://example.com/conflict-ukraine",
      title: "Russia launches new strike on Ukraine infrastructure",
      seendate: "20260313T100000Z",
      socialimage: "",
      domain: "example.com",
      language: "English",
      sourcecountry: "United States",
    },
    {
      url: "https://example.com/sanctions-iran",
      title: "New sanctions imposed on Iran nuclear program",
      seendate: "20260313T090000Z",
      socialimage: "",
      domain: "reuters.com",
      language: "English",
      sourcecountry: "United Kingdom",
    },
  ],
};

describe("GdeltGeoCollector", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_GDELT_RESPONSE),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should collect geo events from GDELT API", async () => {
    const collector = new GdeltGeoCollector();
    const result = await collector.collect();

    expect(result.data).toHaveLength(2);
    expect(result.source).toBe("gdelt-geo");
  });

  it("should classify event types from titles", async () => {
    const collector = new GdeltGeoCollector();
    const result = await collector.collect();

    expect(result.data[0].eventType).toBe("conflict");
    expect(result.data[1].eventType).toBe("sanctions");
  });

  it("should extract countries from text", async () => {
    const collector = new GdeltGeoCollector();
    const result = await collector.collect();

    expect(result.data[0].countries).toContain("RU");
    expect(result.data[0].countries).toContain("UA");
    expect(result.data[1].countries).toContain("IR");
  });

  it("should handle empty response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ articles: [] }),
      }),
    );

    const collector = new GdeltGeoCollector();
    const result = await collector.collect();

    expect(result.data).toHaveLength(0);
  });

  it("should throw on API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const collector = new GdeltGeoCollector();
    await expect(collector.collect()).rejects.toThrow("GDELT Geo API error: 500");
  });
});

describe("classifyEventType", () => {
  it("should classify conflict events", () => {
    expect(classifyEventType("Military attack on civilian areas")).toBe("conflict");
  });

  it("should classify protest events", () => {
    expect(classifyEventType("Mass demonstration in capital")).toBe("protest");
  });

  it("should classify sanctions events", () => {
    expect(classifyEventType("New economic sanction against country")).toBe("sanctions");
  });

  it("should classify diplomacy events", () => {
    expect(classifyEventType("Peace talk between nations at summit")).toBe("diplomacy");
  });

  it("should return null for unknown events", () => {
    expect(classifyEventType("Weather forecast for tomorrow")).toBeNull();
  });
});

describe("extractCountries", () => {
  it("should extract multiple countries", () => {
    const countries = extractCountries("United States and China trade tensions");
    expect(countries).toContain("US");
    expect(countries).toContain("CN");
  });

  it("should return empty for no matches", () => {
    expect(extractCountries("Local sports update")).toEqual([]);
  });
});
