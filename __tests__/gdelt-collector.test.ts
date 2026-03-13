import { describe, it, expect, vi, beforeEach } from "vitest";
import { GdeltCollector } from "../src/adapters/collectors/gdelt-collector";

const MOCK_GDELT_RESPONSE = {
  articles: [
    {
      url: "https://example.com/article1",
      url_mobile: "",
      title: "Iran military exercises near Hormuz strait raise tensions",
      seendate: "20260313T120000Z",
      socialimage: "https://example.com/image1.jpg",
      domain: "reuters.com",
      language: "English",
      sourcecountry: "United States",
    },
    {
      url: "https://example.com/article2",
      url_mobile: "",
      title: "EU trade negotiations with China stall over tariff disputes",
      seendate: "20260313T110000Z",
      socialimage: "",
      domain: "bbc.co.uk",
      language: "English",
      sourcecountry: "United Kingdom",
    },
  ],
};

describe("GdeltCollector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse GDELT articles into RawArticle format", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_GDELT_RESPONSE), { status: 200 }),
    );

    const collector = new GdeltCollector();
    const result = await collector.collect();

    expect(result.source).toBe("gdelt");
    expect(result.data).toHaveLength(2);

    const first = result.data[0];
    expect(first.source).toBe("gdelt");
    expect(first.url).toBe("https://example.com/article1");
    expect(first.title).toBe("Iran military exercises near Hormuz strait raise tensions");
    expect(first.category).toBe("military");
    expect(first.region).toBe("middle-east");
    expect(first.imageUrl).toBe("https://example.com/image1.jpg");
    expect(first.originalLanguage).toBe("en");
    expect(first.publishedAt).toBeInstanceOf(Date);
  });

  it("should classify economy category from trade-related article", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_GDELT_RESPONSE), { status: 200 }),
    );

    const collector = new GdeltCollector();
    const result = await collector.collect();

    const second = result.data[1];
    expect(second.category).toBe("economy");
    expect(second.imageUrl).toBeNull();
  });

  it("should handle empty response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const collector = new GdeltCollector();
    const result = await collector.collect();

    expect(result.data).toHaveLength(0);
  });

  it("should throw on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Server error", { status: 500, statusText: "Internal Server Error" }),
    );

    const collector = new GdeltCollector();
    await expect(collector.collect()).rejects.toThrow("GDELT API error: 500");
  });

  it("should generate unique sourceId per URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_GDELT_RESPONSE), { status: 200 }),
    );

    const collector = new GdeltCollector();
    const result = await collector.collect();

    const ids = result.data.map((a) => a.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toHaveLength(16);
  });
});
