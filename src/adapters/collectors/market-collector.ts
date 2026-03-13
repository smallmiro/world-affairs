import YahooFinance from "yahoo-finance2";
import type { MarketCollectorPort } from "../../domain/market/ports";
import type { RawMarketData } from "../../domain/market/entities";
import type { CollectionResult, MarketType } from "../../shared/types";

interface TickerConfig {
  symbol: string;
  name: string;
  type: MarketType;
  currency: string;
}

const TICKERS: TickerConfig[] = [
  // Stock indices
  { symbol: "^KS11", name: "KOSPI", type: "stock_index", currency: "KRW" },
  { symbol: "^KQ11", name: "KOSDAQ", type: "stock_index", currency: "KRW" },
  { symbol: "^GSPC", name: "S&P 500", type: "stock_index", currency: "USD" },
  { symbol: "^IXIC", name: "NASDAQ", type: "stock_index", currency: "USD" },
  { symbol: "^DJI", name: "DOW JONES", type: "stock_index", currency: "USD" },
  { symbol: "^N225", name: "NIKKEI 225", type: "stock_index", currency: "JPY" },
  // Commodities
  { symbol: "CL=F", name: "WTI Crude", type: "commodity", currency: "USD" },
  { symbol: "BZ=F", name: "Brent Crude", type: "commodity", currency: "USD" },
  { symbol: "NG=F", name: "Natural Gas", type: "commodity", currency: "USD" },
  { symbol: "GC=F", name: "Gold", type: "commodity", currency: "USD" },
  { symbol: "SI=F", name: "Silver", type: "commodity", currency: "USD" },
  { symbol: "HG=F", name: "Copper", type: "commodity", currency: "USD" },
  // Forex
  { symbol: "USDKRW=X", name: "USD/KRW", type: "forex", currency: "KRW" },
  { symbol: "EURUSD=X", name: "EUR/USD", type: "forex", currency: "USD" },
  { symbol: "USDJPY=X", name: "USD/JPY", type: "forex", currency: "JPY" },
  // Volatility & Crypto
  { symbol: "^VIX", name: "VIX", type: "volatility", currency: "USD" },
  { symbol: "BTC-USD", name: "Bitcoin", type: "crypto", currency: "USD" },
];

export class MarketCollector implements MarketCollectorPort {
  private tickers: TickerConfig[];
  private yf: InstanceType<typeof YahooFinance>;

  constructor(tickers?: TickerConfig[]) {
    this.tickers = tickers ?? TICKERS;
    this.yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  }

  async collect(): Promise<CollectionResult<RawMarketData[]>> {
    const results: RawMarketData[] = [];

    // Fetch quotes one by one to handle individual failures gracefully
    for (const ticker of this.tickers) {
      try {
        const quote = await this.yf.quote(ticker.symbol);
        if (quote.regularMarketPrice == null) continue;

        results.push({
          symbol: ticker.symbol,
          type: ticker.type,
          name: ticker.name,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange ?? 0,
          changePct: quote.regularMarketChangePercent ?? 0,
          open: quote.regularMarketOpen ?? null,
          high: quote.regularMarketDayHigh ?? null,
          low: quote.regularMarketDayLow ?? null,
          volume: quote.regularMarketVolume ?? null,
          currency: ticker.currency,
        });
      } catch (error) {
        console.error(`Failed to fetch ${ticker.symbol}:`, error);
      }
    }

    return {
      data: results,
      collectedAt: new Date(),
      source: "yahoo-finance",
    };
  }
}
