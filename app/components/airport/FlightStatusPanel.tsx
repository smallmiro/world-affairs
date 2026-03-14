"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

type Tab = "arrivals" | "departures";

async function fetchDxbFlights(direction: string): Promise<DxbFlight[]> {
  const res = await fetch(`/api/airport/flights?direction=${direction}&limit=100`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data;
}

export default function FlightStatusPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("departures");
  const direction = activeTab === "departures" ? "departure" : "arrival";

  const { data: flights } = useQuery({
    queryKey: ["dxb-flight-status", direction],
    queryFn: () => fetchDxbFlights(direction),
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
          dubaiairports.ae · 10min
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(["departures", "arrivals"] as Tab[]).map((tab) => (
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
            {tab === "departures" ? "출발 DEPARTURES" : "도착 ARRIVALS"} ({activeTab === tab ? list.length : "..."})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: 280, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
        <table className="w-full border-collapse font-mono text-[0.58rem]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>편명</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>항공사</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>{activeTab === "departures" ? "목적지" : "출발지"}</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>예정</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>실제</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>터미널</th>
              <th className="text-left py-1 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.46rem" }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-4" style={{ color: "var(--text-muted)" }}>데이터 로딩 중...</td></tr>
            )}
            {list.map((f, i) => {
              const isEK = f.flightCode.startsWith("EK ");
              const isFZ = f.flightCode.startsWith("FZ ");
              const statusColor = STATUS_COLORS[f.status] ?? "var(--text-muted)";
              const isDelayed = f.status === "Delayed" || f.status === "Cancelled";
              return (
                <tr
                  key={f.id ?? f.flightCode + i}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="py-1 px-2 font-semibold" style={{ color: isEK ? "var(--accent-amber)" : isFZ ? "var(--accent-cyan)" : "var(--text-primary)" }}>
                    {f.flightCode}
                  </td>
                  <td className="py-1 px-2" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>{f.airline}</td>
                  <td className="py-1 px-2" style={{ color: "var(--text-secondary)" }}>{f.destination}</td>
                  <td className="py-1 px-2" style={{ color: "var(--text-muted)" }}>{f.scheduled}</td>
                  <td className="py-1 px-2" style={{ color: isDelayed ? "var(--accent-red)" : "var(--text-muted)" }}>{f.actual}</td>
                  <td className="py-1 px-2" style={{ color: "var(--text-muted)" }}>{f.terminal}</td>
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
