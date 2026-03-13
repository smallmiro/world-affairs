import { describe, it, expect, vi } from "vitest";
import { collectMarket } from "../src/usecases/collect-market";
import type { MarketCollectorPort, MarketRepositoryPort } from "../src/domain/market/ports";
import type { RawMarketData } from "../src/domain/market/entities";

const SAMPLE_DATA: RawMarketData[] = [
  {
    symbol: "^KS11", type: "stock_index", name: "KOSPI",
    price: 2648.32, change: -28.15, changePct: -1.05,
    open: 2676.47, high: 2680.0, low: 2640.0, volume: 350000000,
    currency: "KRW",
  },
  {
    symbol: "CL=F", type: "commodity", name: "WTI Crude",
    price: 89.24, change: 3.18, changePct: 3.69,
    open: 86.06, high: 89.50, low: 85.80, volume: 580000,
    currency: "USD",
  },
  {
    symbol: "USDKRW=X", type: "forex", name: "USD/KRW",
    price: 1368.50, change: 8.20, changePct: 0.60,
    open: 1360.30, high: 1370.00, low: 1358.00, volume: null,
    currency: "KRW",
  },
];

function createMockCollector(data: RawMarketData[]): MarketCollectorPort {
  return {
    collect: vi.fn().mockResolvedValue({
      data,
      collectedAt: new Date(),
      source: "yahoo-finance",
    }),
  };
}

function createMockRepository(): MarketRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findLatestByType: vi.fn().mockResolvedValue([]),
    findHistory: vi.fn().mockResolvedValue([]),
  };
}

describe("collectMarket", () => {
  it("should collect and save market snapshots", async () => {
    const collector = createMockCollector(SAMPLE_DATA);
    const repo = createMockRepository();

    const result = await collectMarket(collector, repo);

    expect(result.total).toBe(3);
    expect(result.saved).toBe(3);
    expect(repo.save).toHaveBeenCalledTimes(1);

    const savedSnapshots = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedSnapshots).toHaveLength(3);

    const kospi = savedSnapshots.find((s: { symbol: string }) => s.symbol === "^KS11");
    expect(kospi.price).toBe(2648.32);
    expect(kospi.change).toBe(-28.15);
    expect(kospi.type).toBe("stock_index");
    expect(kospi.currency).toBe("KRW");
    expect(kospi.id).toBeDefined();
    expect(kospi.timestamp).toBeInstanceOf(Date);
  });

  it("should handle empty collector result", async () => {
    const collector = createMockCollector([]);
    const repo = createMockRepository();

    const result = await collectMarket(collector, repo);

    expect(result.total).toBe(0);
    expect(result.saved).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("should preserve all market data fields", async () => {
    const collector = createMockCollector([SAMPLE_DATA[1]]);
    const repo = createMockRepository();

    await collectMarket(collector, repo);

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
    expect(saved.open).toBe(86.06);
    expect(saved.high).toBe(89.50);
    expect(saved.low).toBe(85.80);
    expect(saved.volume).toBe(580000);
  });

  it("should handle null volume for forex", async () => {
    const collector = createMockCollector([SAMPLE_DATA[2]]);
    const repo = createMockRepository();

    await collectMarket(collector, repo);

    const saved = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
    expect(saved.volume).toBeNull();
    expect(saved.type).toBe("forex");
  });
});
