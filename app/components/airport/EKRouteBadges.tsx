"use client";

import { useT } from "../../hooks/use-t";
import type { EKRoute, RouteStatus } from "../../lib/airport-data";

const STATUS_STYLES: Record<RouteStatus, { color: string; bg: string; label: string }> = {
  open: { color: "var(--accent-green)", bg: "var(--accent-green-dim)", label: "OPEN" },
  diverted: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", label: "DIVRT" },
  suspended: { color: "var(--accent-red)", bg: "var(--accent-red-dim)", label: "SUSP" },
};

interface EKRouteBadgesProps {
  routes: EKRoute[];
}

export default function EKRouteBadges({ routes }: EKRouteBadgesProps) {
  const t = useT();
  return (
    <div>
      <div className="font-mono text-[0.8rem] tracking-[1.5px] uppercase mb-1.5" style={{ color: "var(--accent-amber)" }}>
        {t("airport.ekRoutes")}
      </div>
      <div className="grid grid-cols-3 gap-1 max-lg:grid-cols-2">
        {routes.map((r) => {
          const s = STATUS_STYLES[r.status];
          return (
            <div
              key={r.flightCode}
              className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[0.75rem] border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <span style={{ color: "var(--text-secondary)", letterSpacing: "0.3px" }}>{r.dest}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{r.flightCode}</span>
              <span
                className="ml-auto font-semibold"
                style={{ color: s.color, background: s.bg, padding: "0 3px", fontSize: "0.7rem", letterSpacing: "0.3px" }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
