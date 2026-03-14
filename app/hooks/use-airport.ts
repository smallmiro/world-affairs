"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAirportStatus,
  fetchFlightPositions,
  fetchAirportEvents,
  fetchAirlineOps,
  fetchEmiratesRoutes,
} from "../lib/api-client";

export function useAirportStatus() {
  return useQuery({
    queryKey: ["airport", "status"],
    queryFn: fetchAirportStatus,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

export function useFlightPositions(limit?: number) {
  return useQuery({
    queryKey: ["airport", "flights", limit],
    queryFn: () => fetchFlightPositions(limit),
    refetchInterval: 300 * 1000,
    staleTime: 120 * 1000,
  });
}

export function useAirportEvents(limit?: number) {
  return useQuery({
    queryKey: ["airport", "events", limit],
    queryFn: () => fetchAirportEvents(limit),
    refetchInterval: 300 * 1000,
    staleTime: 60 * 1000,
  });
}

export function useAirlineOps() {
  return useQuery({
    queryKey: ["airport", "airlines"],
    queryFn: fetchAirlineOps,
    refetchInterval: 300 * 1000,
    staleTime: 60 * 1000,
  });
}

export function useEmiratesRoutes() {
  return useQuery({
    queryKey: ["airport", "routes"],
    queryFn: fetchEmiratesRoutes,
    refetchInterval: 300 * 1000,
    staleTime: 60 * 1000,
  });
}

interface DxbAirline {
  code: string;
  name: string;
  flights: number;
  onTime: number;
  status: "normal" | "delays" | "disrupted";
}

interface DxbEkRoute {
  dest: string;
  flightCode: string;
  status: "open" | "diverted" | "suspended";
}

interface DxbStats {
  airlines: DxbAirline[];
  ekRoutes: DxbEkRoute[];
  count: number;
}

async function fetchDxbStats(): Promise<DxbStats> {
  const res = await fetch("/api/airport/dxb-stats");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export function useDxbStats() {
  return useQuery({
    queryKey: ["airport", "dxb-stats"],
    queryFn: fetchDxbStats,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}
