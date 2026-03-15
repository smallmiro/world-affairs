"use client";

import { useState, useCallback } from "react";
import { useAllMarkets } from "../../hooks/use-markets";
import {
  formatPrice,
  formatChange,
  formatChangePct,
  getDirection,
  getChangeColor,
  getDirectionArrow,
} from "../../lib/format-utils";
import type { MarketSnapshot } from "../../lib/types";
import IntraDayChart from "../ui/IntraDayChart";

function TickerItem({ item, tapped, onTap }: { item: MarketSnapshot; tapped: boolean; onTap: () => void }) {
  const dir = getDirection(item.change);
  const color = getChangeColor(dir);
  const arrow = getDirectionArrow(dir);

  const hasOhlc = item.open != null && item.high != null && item.low != null;

  return (
    <div
      className="flex flex-col justify-center px-4 py-[7px] border-r shrink-0 cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-card-hover)]"
      style={{ borderColor: "var(--border)", whiteSpace: "nowrap" }}
      onClick={onTap}
    >
      <div className="flex items-center gap-2 h-5">
        <span className="font-mono text-[0.85rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
          {item.name || item.symbol}
        </span>
        <span className="font-mono text-[0.78rem] font-semibold" style={{ color: "var(--text-primary)" }}>
          {formatPrice(item.price, item.currency)}
        </span>
        <span className="font-mono text-[0.85rem] font-semibold" style={{ color }}>
          {arrow} {formatChange(item.change)} ({formatChangePct(item.changePct)})
        </span>
      </div>
      {hasOhlc && (
        <div
          className="ticker-chart-expand"
          style={{
            maxHeight: tapped ? 80 : 0,
            overflow: "hidden",
            opacity: tapped ? 1 : 0,
            transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, margin-top 0.4s cubic-bezier(0.4,0,0.2,1)",
            marginTop: tapped ? 6 : 0,
          }}
        >
          <IntraDayChart
            open={item.open!}
            high={item.high!}
            low={item.low!}
            price={item.price}
            direction={dir}
          />
        </div>
      )}
    </div>
  );
}

export default function MarketTickerBar() {
  const { data } = useAllMarkets();
  const [tappedSymbol, setTappedSymbol] = useState<string | null>(null);

  const handleTap = useCallback((symbol: string) => {
    setTappedSymbol((prev) => (prev === symbol ? null : symbol));
  }, []);

  const allItems: MarketSnapshot[] = [];
  if (data) {
    const order = ["stock_index", "commodity", "forex", "volatility", "crypto"] as const;
    for (const type of order) {
      if (data[type]) allItems.push(...data[type]);
    }
  }

  if (allItems.length === 0) {
    return (
      <div
        className="flex items-center px-6 py-2 border-b"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[0.75rem] md:text-[0.65rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
          MARKET DATA LOADING...
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .market-ticker-bar:hover .ticker-chart-expand {
            max-height: 80px !important;
            opacity: 1 !important;
            margin-top: 6px !important;
          }
        }
      `}</style>
      <div
        className="market-ticker-bar overflow-hidden border-b relative z-50"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex items-stretch"
          style={{ animation: "scroll-market 60s linear infinite", width: "max-content" }}
        >
          {allItems.map((item) => (
            <TickerItem
              key={"a-" + (item.id ?? item.symbol)}
              item={item}
              tapped={tappedSymbol === (item.id ?? item.symbol)}
              onTap={() => handleTap(item.id ?? item.symbol)}
            />
          ))}
          {allItems.map((item) => (
            <TickerItem
              key={"b-" + (item.id ?? item.symbol)}
              item={item}
              tapped={tappedSymbol === (item.id ?? item.symbol)}
              onTap={() => handleTap(item.id ?? item.symbol)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
