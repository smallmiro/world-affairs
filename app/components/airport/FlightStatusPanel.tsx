"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useT } from "../../hooks/use-t";

interface DxbFlight {
  id: string;
  flightCode: string;
  airline: string;
  destination: string;
  scheduled: string;
  actual: string;
  terminal: string;
  gate: string;
  status: string;
  direction: string;
}

interface EkRoute {
  dest: string;
  flightCode: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  "On Time": "var(--accent-green)",
  "Scheduled": "var(--accent-cyan)",
  "Gate Closed": "var(--accent-cyan)",
  "Final Call": "var(--accent-amber)",
  "Boarding": "var(--accent-green)",
  "Departed": "var(--text-muted)",
  "Landed": "var(--text-muted)",
  "Delayed": "var(--accent-red)",
  "New Time": "var(--accent-amber)",
  "Cancelled": "var(--accent-red)",
};

const ROUTE_STATUS_COLORS: Record<string, string> = {
  open: "var(--accent-green)",
  diverted: "var(--accent-amber)",
  suspended: "var(--accent-red)",
};

const ROUTE_STATUS_LABELS: Record<string, string> = {
  open: "OPEN",
  diverted: "DELAY",
  suspended: "SUSP",
};

type Tab = "departures" | "arrivals" | "ek-routes";

async function fetchDxbFlights(direction: string): Promise<DxbFlight[]> {
  const res = await fetch(`/api/airport/flights?direction=${direction}&limit=100`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data;
}

async function fetchEkRoutes(): Promise<EkRoute[]> {
  const res = await fetch("/api/airport/dxb-stats");
  if (!res.ok) return [];
  const data = await res.json();
  return data.ekRoutes ?? [];
}

export default function FlightStatusPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("departures");
  const t = useT();

  const { data: depFlights } = useQuery({ queryKey: ["dxb-dep"], queryFn: () => fetchDxbFlights("departure"), refetchInterval: 120_000 });
  const { data: arrFlights } = useQuery({ queryKey: ["dxb-arr"], queryFn: () => fetchDxbFlights("arrival"), refetchInterval: 120_000 });
  const { data: ekRoutes } = useQuery({ queryKey: ["ek-routes"], queryFn: fetchEkRoutes, refetchInterval: 120_000 });

  const flightList = activeTab === "departures" ? (depFlights ?? []) : activeTab === "arrivals" ? (arrFlights ?? []) : [];
  const routeList = ekRoutes ?? [];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "departures", label: t("airport.departures"), count: depFlights?.length ?? 0 },
    { key: "arrivals", label: t("airport.arrivals"), count: arrFlights?.length ?? 0 },
    { key: "ek-routes", label: t("airport.ekRoutes"), count: routeList.length },
  ];

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5" style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
          <span className="font-mono text-[0.85rem] font-semibold tracking-[1.5px] uppercase" style={{ color: "var(--text-secondary)" }}>
            {t("airport.flightStatus")}
          </span>
        </div>
        <span className="font-mono text-[0.7rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
          dubaiairports.ae · 10min
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="font-mono text-[0.8rem] tracking-[1px] px-2.5 py-2.5 border rounded-lg cursor-pointer transition-all duration-150"
            style={{
              color: activeTab === tab.key ? "var(--accent-amber)" : "var(--text-muted)",
              borderColor: activeTab === tab.key ? "var(--accent-amber)" : "var(--border)",
              background: activeTab === tab.key ? "var(--accent-amber-dim)" : "transparent",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Flight Table (departures/arrivals) */}
      {activeTab !== "ek-routes" && (
        <div className="overflow-x-auto" style={{ maxHeight: 280, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
          <table className="w-full border-collapse font-mono text-[0.8rem]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.flightCode")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.airline")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{activeTab === "departures" ? t("airport.destination") : t("airport.origin")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.scheduled")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.status")}</th>
              </tr>
            </thead>
            <tbody>
              {flightList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</td></tr>
              )}
              {flightList.map((f, i) => {
                const isEK = f.flightCode.startsWith("EK ");
                const statusColor = STATUS_COLORS[f.status] ?? "var(--text-muted)";
                return (
                  <tr
                    key={f.id ?? f.flightCode + i}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="py-1.5 px-2 font-semibold" style={{ color: isEK ? "var(--accent-amber)" : "var(--text-primary)" }}>{f.flightCode}</td>
                    <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>{f.airline}</td>
                    <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>{f.destination}</td>
                    <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>{f.scheduled}</td>
                    <td className="py-1.5 px-2">
                      <span className="font-mono text-[0.7rem] font-bold tracking-[0.5px] px-1.5 py-0.5 rounded" style={{ color: statusColor, background: `${statusColor}15` }}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EK Routes Table */}
      {activeTab === "ek-routes" && (
        <div className="overflow-x-auto" style={{ maxHeight: 280, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
          <table className="w-full border-collapse font-mono text-[0.8rem]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.flightCode")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.destination")}</th>
                <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{t("airport.status")}</th>
              </tr>
            </thead>
            <tbody>
              {routeList.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</td></tr>
              )}
              {routeList.map((r, i) => {
                const color = ROUTE_STATUS_COLORS[r.status] ?? "var(--text-muted)";
                const label = ROUTE_STATUS_LABELS[r.status] ?? r.status.toUpperCase();
                return (
                  <tr
                    key={r.flightCode + i}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="py-1.5 px-2 font-semibold" style={{ color: "var(--accent-amber)" }}>{r.flightCode}</td>
                    <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>{r.dest}</td>
                    <td className="py-1.5 px-2">
                      <span className="font-mono text-[0.7rem] font-bold tracking-[0.5px] px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
