"use client";

import { useAllMarkets } from "../../hooks/use-markets";
import { useT } from "../../hooks/use-t";
import SectionHeader from "../ui/SectionHeader";
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

function StockCard({ item }: { item: MarketSnapshot }) {
  const dir = getDirection(item.change);
  const color = getChangeColor(dir);
  const arrow = getDirectionArrow(dir);

  return (
    <div
      className="p-3.5 border rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--border-active)]"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-[0.8rem] tracking-[1px] uppercase" style={{ color: "var(--text-muted)" }}>
          {item.name || item.symbol}
        </span>
      </div>
      <div className="font-mono text-[1.15rem] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {formatPrice(item.price, item.currency)}
      </div>
      <div className="font-mono text-[0.75rem] md:text-[0.68rem] font-semibold flex items-center gap-1.5" style={{ color }}>
        {arrow} {formatChange(item.change)}{" "}
        <span
          className="px-1 py-px text-[0.8rem]"
          style={{ background: dir === "up" ? "var(--accent-red-dim)" : "var(--accent-blue-dim)" }}
        >
          {formatChangePct(item.changePct)}
        </span>
      </div>
      {item.open != null && item.high != null && item.low != null && (
        <div className="mt-2">
          <IntraDayChart
            open={item.open}
            high={item.high}
            low={item.low}
            price={item.price}
            direction={dir}
            height={36}
          />
        </div>
      )}
    </div>
  );
}

function CommodityRow({ item }: { item: MarketSnapshot }) {
  const dir = getDirection(item.change);
  const color = getChangeColor(dir);
  const isVix = item.symbol === "^VIX" || item.name?.includes("VIX");

  return (
    <tr className="transition-colors duration-100 hover:bg-[var(--bg-secondary)]">
      <td className="font-mono text-[0.75rem] py-2 px-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <span className="text-[0.75rem] md:text-[0.7rem]" style={{ color: "var(--text-secondary)" }}>{item.name || item.symbol}</span>
        <span className="text-[0.75rem] ml-1" style={{ color: "var(--text-muted)" }}>{item.currency}</span>
      </td>
      <td
        className="font-mono text-[0.75rem] py-2 px-2.5 border-b font-semibold"
        style={{
          borderColor: "var(--border)",
          color: isVix ? "var(--accent-red)" : "var(--text-primary)",
        }}
      >
        {formatPrice(item.price, item.currency)}
      </td>
      <td className="font-mono text-[0.75rem] py-2 px-2.5 border-b text-right" style={{ borderColor: "var(--border)", color }}>
        {formatChange(item.change)}
      </td>
      <td
        className="font-mono text-[0.75rem] py-2 px-2.5 border-b text-right"
        style={{
          borderColor: "var(--border)",
          color,
          fontWeight: isVix ? 700 : undefined,
        }}
      >
        {formatChangePct(item.changePct)}
      </td>
    </tr>
  );
}

export default function MarketSection() {
  const { data, isLoading } = useAllMarkets();
  const t = useT();

  const stockIndices = data?.stock_index ?? [];
  const commodities = data?.commodity ?? [];
  const forex = data?.forex ?? [];
  const volatility = data?.volatility ?? [];
  const tableItems = [...commodities, ...forex, ...volatility];

  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      style={{
        animation: "fade-in-up 0.4s ease-out 0.25s both",
      }}
    >
      {/* Stock market */}
      <div className="p-4">
        <div className="mb-4">
          <SectionHeader title={t("markets.stocks")} accentColor="var(--accent-amber)" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[0.75rem] md:text-[0.72rem]" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stockIndices.map((item) => (
              <StockCard key={item.id ?? item.symbol} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Commodities table */}
      <div className="p-4">
        <div className="mb-4">
          <SectionHeader title={t("markets.commodities")} accentColor="var(--accent-amber)" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[0.75rem] md:text-[0.72rem]" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[t("markets.symbol"), t("markets.price"), t("markets.change"), t("markets.changePct")].map((th, i) => (
                  <th
                    key={th}
                    className="font-mono text-[0.75rem] tracking-[1px] uppercase py-1.5 px-2.5 border-b"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                      textAlign: i >= 2 ? "right" : "left",
                    }}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableItems.map((item) => (
                <CommodityRow key={item.id ?? item.symbol} item={item} />
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </section>
  );
}
