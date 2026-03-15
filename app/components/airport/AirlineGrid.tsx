"use client";

import { useT } from "../../hooks/use-t";
import type { Airline } from "../../lib/airport-data";
import StatusLight from "../ui/StatusLight";

const STATUS_TO_LIGHT: Record<string, "green" | "amber" | "red"> = {
  normal: "green",
  delays: "amber",
  disrupted: "red",
};

const STATUS_COLORS: Record<string, string> = {
  normal: "var(--accent-green)",
  delays: "var(--accent-amber)",
  disrupted: "var(--accent-red)",
};

interface AirlineGridProps {
  airlines: Airline[];
}

export default function AirlineGrid({ airlines }: AirlineGridProps) {
  const t = useT();
  return (
    <div>
      <div className="font-mono text-[0.8rem] tracking-[1.5px] uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>
        {t("airport.airlines")}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {airlines.map((a) => (
          <div
            key={a.code}
            className="flex items-center gap-2 px-2.5 py-1.5 border"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <StatusLight color={STATUS_TO_LIGHT[a.status] ?? "green"} size={5} pulse={false} glow={false} />
            <span className="font-mono text-[0.8rem] flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
              {a.name}
            </span>
            <span className="font-mono text-[0.65rem] font-semibold" style={{ color: "var(--text-primary)" }}>
              {a.flights}{t("airport.flights")}
            </span>
            <span className="font-mono text-[0.72rem]" style={{ color: STATUS_COLORS[a.status] }}>
              {a.onTime}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
