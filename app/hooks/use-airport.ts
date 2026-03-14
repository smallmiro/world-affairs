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
    refetchInterval: 60 * 1000,
    staleTime: 15 * 1000,
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
