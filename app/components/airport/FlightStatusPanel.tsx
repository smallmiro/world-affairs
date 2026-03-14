"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface FlightStatus {
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
  "Gate Closed": "var(--accent-cyan)",
  "Final Call": "var(--accent-amber)",
  "Boarding": "var(--accent-green)",
  "Departed": "var(--text-muted)",
  "Landed": "var(--text-muted)",
  "Delayed": "var(--accent-red)",
  "New Time": "var(--accent-amber)",
  "Cancelled": "var(--accent-red)",
};

// Static fallback data when DB is empty
const FALLBACK_DEPARTURES: Omit<FlightStatus, "id" | "direction">[] = [
  { flightCode: "EK 029", airline: "Emirates", destination: "LHR London", scheduled: "09:05", actual: "09:10", terminal: "T3", gate: "A15", status: "Final Call" },
  { flightCode: "EK 370", airline: "Emirates", destination: "SAI Siem Reap", scheduled: "08:55", actual: "08:55", terminal: "T3", gate: "B11", status: "Gate Closed" },
  { flightCode: "EK 261", airline: "Emirates", destination: "GRU São Paulo", scheduled: "09:05", actual: "09:05", terminal: "T3", gate: "A1", status: "Gate Closed" },
  { flightCode: "EK 304", airline: "Emirates", destination: "PVG Shanghai", scheduled: "09:15", actual: "09:15", terminal: "T3", gate: "C7", status: "Final Call" },
  { flightCode: "EK 372", airline: "Emirates", destination: "BKK Bangkok", scheduled: "09:30", actual: "09:30", terminal: "T3", gate: "C9", status: "Boarding" },
  { flightCode: "FZ 8123", airline: "flydubai", destination: "EVN Yerevan", scheduled: "08:55", actual: "08:55", terminal: "T2", gate: "F8", status: "Gate Closed" },
  { flightCode: "SG 5506", airline: "SpiceJet", destination: "DEL New Delhi", scheduled: "11:10", actual: "11:10", terminal: "T1", gate: "D1", status: "On Time" },
];

const FALLBACK_ARRIVALS: Omit<FlightStatus, "id" | "direction">[] = [
  { flightCode: "EK 006", airline: "Emirates", destination: "LHR London", scheduled: "09:45", actual: "10:33", terminal: "T3", gate: "12", status: "Delayed" },
  { flightCode: "EK 242", airline: "Emirates", destination: "YYZ Toronto", scheduled: "12:30", actual: "13:18", terminal: "T3", gate: "11", status: "Delayed" },
  { flightCode: "EK 820", airline: "Emirates", destination: "RUH Riyadh", scheduled: "12:35", actual: "13:50", terminal: "T3", gate: "4", status: "Delayed" },
  { flightCode: "FZ 998", airline: "flydubai", destination: "SVX Yekaterinburg", scheduled: "11:00", actual: "13:42", terminal: "T2", gate: "3", status: "Delayed" },
  { flightCode: "6E 1461", airline: "IndiGo", destination: "DEL New Delhi", scheduled: "10:20", actual: "10:22", terminal: "T1", gate: "8", status: "New Time" },
];

type Tab = "departures" | "arrivals";

async function fetchDxbFlights(direction: string): Promise<FlightStatus[]> {
  const res = await fetch(`/api/airport/flights?direction=${direction}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.data;
}

export default function FlightStatusPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("departures");
  const direction = activeTab === "departures" ? "departure" : "arrival";

  const { data: dbFlights } = useQuery({
    queryKey: ["dxb-flights", direction],
    queryFn: () => fetchDxbFlights(direction),
    refetchInterval: 300_000,
  });

  // Use DB data or fallback
  const flights = dbFlights && dbFlights.length > 0
    ? dbFlights
    : (activeTab === "departures" ? FALLBACK_DEPARTURES : FALLBACK_ARRIVALS) as unknown as FlightStatus[];

  return (
    <div className="p-5 flex flex-col gap-3" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{ background: "var(--accent-amber)", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
          />
          <h2 className="font-mono text-[0.72rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
            DXB FLIGHT STATUS
          </h2>
        </div>
        <a
          href="https://dubaiairports.ae/flight-status"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[0.5rem] tracking-[1px]"
          style={{ color: "var(--accent-cyan)" }}
        >
          dubaiairports.ae →
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["departures", "arrivals"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="font-mono text-[0.65rem] tracking-[1px] px-3 py-1 border cursor-pointer transition-all duration-150"
            style={{
              color: activeTab === tab ? "var(--accent-amber)" : "var(--text-muted)",
              borderColor: activeTab === tab ? "var(--accent-amber)" : "var(--border)",
              background: activeTab === tab ? "var(--accent-amber-dim)" : "transparent",
            }}
          >
            {tab === "departures" ? "출발 DEPARTURES" : "도착 ARRIVALS"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: 300, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}>
        <table className="w-full border-collapse font-mono text-[0.62rem]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>편명</th>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>{activeTab === "departures" ? "목적지" : "출발지"}</th>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>예정</th>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>실제</th>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>터미널</th>
              <th className="text-left py-1.5 px-2 tracking-[1px] uppercase" style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f, i) => {
              const code = f.flightCode ?? "";
              const statusColor = STATUS_COLORS[f.status] ?? "var(--text-muted)";
              const isDelayed = f.status === "Delayed" || f.status === "Cancelled";
              return (
                <tr
                  key={code + f.scheduled + i}
                  className="transition-colors duration-100"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="py-1.5 px-2 font-semibold" style={{ color: code.startsWith("EK") ? "var(--accent-amber)" : "var(--text-primary)" }}>
                    {code}
                  </td>
                  <td className="py-1.5 px-2" style={{ color: "var(--text-secondary)" }}>{f.destination}</td>
                  <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>{f.scheduled}</td>
                  <td className="py-1.5 px-2" style={{ color: isDelayed ? "var(--accent-red)" : "var(--text-muted)" }}>{f.actual}</td>
                  <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>{f.terminal} {f.gate}</td>
                  <td className="py-1.5 px-2">
                    <span
                      className="font-mono text-[0.5rem] font-bold tracking-[0.5px] px-1.5 py-px uppercase"
                      style={{ color: statusColor, background: `${statusColor}15` }}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warning */}
      <div
        className="font-mono text-[0.52rem] px-3 py-1.5 border"
        style={{ color: "var(--accent-amber)", borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}
      >
        ⚠ Passengers are advised not to travel to the airport unless they have received a confirmed departure time.
      </div>
    </div>
  );
}
