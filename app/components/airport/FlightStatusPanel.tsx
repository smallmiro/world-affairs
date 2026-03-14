"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface OpenSkyFlight {
  flightCode: string;
  origin: string;
  originName: string;
  depAirport: string | null;
  arrAirport: string | null;
  depTime: string;
  arrTime: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  "In Flight": "var(--accent-cyan)",
  "Landed": "var(--accent-green)",
};

type Tab = "arrivals" | "departures";

async function fetchOpenSkyFlights(direction: string): Promise<OpenSkyFlight[]> {
  const res = await fetch(`/api/airport/opensky-flights?direction=${direction}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data;
}

export default function FlightStatusPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("arrivals");

  const { data: flights } = useQuery({
    queryKey: ["opensky-flights", activeTab],
    queryFn: () => fetchOpenSkyFlights(activeTab === "arrivals" ? "arrival" : "departure"),
    refetchInterval: 120_000,
  });

  const list = flights ?? [];

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5" style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
          <span className="font-mono text-[0.62rem] font-semibold tracking-[1.5px] uppercase" style={{ color: "var(--text-secondary)" }}>
            DXB FLIGHT STATUS
          </span>
        </div>
        <span className="font-mono text-[0.46rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
          OpenSky · 12H
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(["arrivals", "departures"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-mono text-[0.58rem] tracking-[1px] px-2.5 py-0.5 border cursor-pointer transition-all duration-150"
            style={{
              color: activeTab === tab ? "var(--accent-amber)" : "var(--text-muted)",
              borderColor: activeTab === tab ? "var(--accent-amber)" : "var(--border)",
              background: activeTab === tab ? "var(--accent-amber-dim)" : "transparent",
            }}
          >
            {tab === "arrivals" ? "도착 ARRIVALS" : "출발 DEPARTURES"} ({activeTab === tab ? list.length : "..."})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: 240, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
        <table className="w-full border-collapse font-mono text-[0.58rem]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>편명</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>{activeTab === "arrivals" ? "출발지" : "목적지"}</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>출발</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>도착</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4" style={{ color: "var(--text-muted)" }}>
                  데이터 로딩 중...
                </td>
              </tr>
            )}
            {list.map((f, i) => {
              const isEK = f.flightCode.startsWith("UAE") || f.flightCode.startsWith("EK");
              const statusColor = STATUS_COLORS[f.status] ?? "var(--text-muted)";
              return (
                <tr
                  key={f.flightCode + i}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="py-1 px-2 font-semibold" style={{ color: isEK ? "var(--accent-amber)" : "var(--text-primary)" }}>
                    {f.flightCode}
                  </td>
                  <td className="py-1 px-2" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-primary)" }}>{f.origin}</span>
                    <span className="ml-1" style={{ color: "var(--text-muted)", fontSize: "0.48rem" }}>{f.originName}</span>
                  </td>
                  <td className="py-1 px-2" style={{ color: "var(--text-muted)" }}>{f.depTime}</td>
                  <td className="py-1 px-2" style={{ color: "var(--text-muted)" }}>{f.arrTime}</td>
                  <td className="py-1 px-2">
                    <span className="font-mono text-[0.46rem] font-bold tracking-[0.5px] px-1 py-px" style={{ color: statusColor, background: `${statusColor}15` }}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
